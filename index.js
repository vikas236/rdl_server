const express = require("express");
const app = express();
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const { promisify } = require("util");
const readdirAsync = promisify(fs.readdir);
const pg = require("pg");

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Middleware to enable CORS
app.use((req, res, next) => {
  // Set the Access-Control-Allow-Origin header to allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Set other CORS headers as needed
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Call next middleware in the chain
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the folder dynamically based on file type or any other criteria
    const folderName = determineFolderName(file.originalname);
    const uploadPath = path.join(__dirname, "uploads", folderName);

    // Create the directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true }); // Create directory recursively
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
  },
});

function determineFolderName(filename) {
  const types = ["slide", "gallery"];
  let result = "product";

  types.forEach((t) => {
    if (filename.slice(0, t.length) == t) result = t;
  });

  return result;
}

const upload = multer({ storage: storage });
// Increase payload size limit (default is 100kb)
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));
let imageFiles = [];

// Serve static files from the 'uploads' directory
app.use(express.static("uploads"));

// Default route
app.get("/", (req, res) => {
  res.send("Express js on Vercel");
});

// get Products data
app.get("/get_data", async (req, res) => {
  try {
    const result = await getTable("menu");
    res.send(result);
  } catch (error) {
    res.status(500).send("Error occurred while checking database.");
  }
});

// get credentials for admin login
app.get("/get_cred", async (req, res) => {
  try {
    const cred = await getTable("login_credentials");
    res.send(cred);
  } catch (error) {
    res.status(500).send("Error occurred while checking database.");
  }
});

// Route to get the contents of a folder
app.get("/folder/:folderName", (req, res) => {
  const folderName = req.params.folderName;
  const folderPath = path.join(__dirname, "uploads", folderName);

  // Read the contents of the folder
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Send the list of files as a JSON response
    res.json({ files: files });
  });
});

// Middleware to parse JSON bodies
app.use(express.json());

// Recieve products data
app.post("/send_data", (req, res) => {
  // Access the JSON data sent from the client
  const objects = req.body;
  updateData(objects);
  res.json({ message: "Data received successfully" });
});

// upload credentials for admin login
app.post("/send_cred", (req, res) => {
  // Access the JSON data sent from the client
  const objects = req.body;
  updateData(objects);
  res.json({ message: "Data received successfully" });
});

// Route to handle image upload
app.post("/uploadslides", async (req, res) => {
  const base64Images = req.body.data;

  if (!base64Images || base64Images.length === 0) return;
  // Define the path to the slide folder
  const uploadPath = path.join(__dirname, "uploads/slide");

  try {
    setImageName();
    for (let i = 0; i < base64Images.length; i++) {
      let base64Image = base64Images[i];
      base64Image = base64Image.replace(/^data:image\/jpeg;base64,/, "");

      // Generate the file name for the uploaded image
      const files = await getFileNames(uploadPath);
      const length = files.length;
      const fileName = `slide${length}.jpg`;

      // Decode base64 image data
      const imageData = Buffer.from(base64Image, "base64");

      // Write the image data to a file in the slide folder
      await fs.promises.writeFile(path.join(uploadPath, fileName), imageData);
    }

    console.log("All images uploaded successfully");
  } catch (error) {
    console.error("Error uploading images:", error);
    return res.status(500).json({ error: "Failed to upload images" });
  }
});

async function setImageName() {
  const uploadPath = path.join(__dirname, "uploads/slide");
  const files = await getFileNames(uploadPath);
  for (let i = 0; i < files.length; i++) {
    await renameImage(files[i], `slide${i}.jpg`, uploadPath);
  }
}

async function getFileNames(uploadPath) {
  try {
    const files = await readdirAsync(uploadPath);
    return files;
  } catch (err) {
    console.error("Error reading directory:", err);
    return [];
  }
}

async function renameImage(oldName, newName, folderPath) {
  // Construct the paths for the old and new image names
  const oldPath = path.join(folderPath, oldName);
  const newPath = path.join(folderPath, newName);

  // Rename the image file
  await new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.error("Error renaming image:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

app.post("/uploadgallery", async (req, res) => {
  const [names, base64Images] = req.body.data;

  if (!base64Images || base64Images.length === 0) return;
  // Define the path to the slide folder
  const uploadPath = path.join(__dirname, "uploads/gallery");
  // create gallery folder it does not exist
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

  try {
    for (let i = 0; i < base64Images.length; i++) {
      const filename = `${names[i]}.png`;
      let base64Image = base64Images[i];

      if (base64Image.length > 50) {
        base64Image = base64Image.replace(/^data:image\/png;base64,/, "");
        // Decode base64 image data
        const imageData = Buffer.from(base64Image, "base64");
        // Write the image data to a file in the slide folder
        await fs.promises.writeFile(path.join(uploadPath, filename), imageData);
      } else {
        const originalname =
          decodeURIComponent(base64Image).match(/\/([^\/]+)$/)[1];
        renameImage(originalname, filename, uploadPath);
      }
    }

    console.log("gallery images updated successfully");
    // getFileNames(uploadPath).then((r) => console.log(r));
  } catch (error) {
    console.error("Error uploading images:", error);
    return res.status(500).json({ error: "Failed to upload images" });
  }
});

// Route to handle deletion of images
app.delete("/images/:filename", (req, res) => {
  const filename = req.params.filename;
  const uploadDirectory = `uploads/product`;
  const filePath = path.join(uploadDirectory, filename);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
        res.status(500).json({ error: "Failed to delete image" });
      } else {
        console.log("Image deleted successfully");
        res.json({ message: "Image deleted successfully" });
        const uploadPath = path.join(__dirname, "uploads/slide");
        getFileNames(uploadPath).then((files) => console.log(files));
      }
    });
  } else {
    res.json({ message: "Image not found" });
  }
});

// Route to handle deletion of images
app.delete("/deletegi/:filename", (req, res) => {
  const filename = req.params.filename;
  const uploadDirectory = `uploads/gallery`;
  const filePath = path.join(uploadDirectory, filename);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
        res.status(500).json({ error: "Failed to delete image" });
      } else {
        console.log("Image deleted successfully");
        res.json({ message: "Image deleted successfully" });
        const uploadPath = path.join(__dirname, "uploads/gallery");
        getFileNames(uploadPath).then((files) => console.log(files));
      }
    });
  } else {
    res.json({ message: "Image not found" });
    console.log("image not found");
  }
});

app.post("/send_bestseller", (req, res) => {
  const dataArray = req.body;

  // Create the folder if it doesn't exist
  const folderPath = path.join(__dirname, "uploads", "bestseller");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Write the array data to a file in the folder
  const filePath = path.join(folderPath, "data.json");
  fs.writeFile(filePath, JSON.stringify(dataArray), (err) => {
    if (err) {
      console.error("Error writing array data to file:", err);
      return res.status(500).json({ error: "Failed to upload array" });
    }
    console.log("Array uploaded successfully");
    res.json({ message: "Array uploaded successfully" });
  });
});

// Route to handle GET request for get bestsellers file
app.get("/get_bestseller", (req, res) => {
  // Define the directory path where the JSON file is located
  const folderPath = path.join(__dirname, "uploads", "bestseller");
  try {
    // Read the JSON file synchronously
    const jsonData = fs.readFileSync(
      path.join(folderPath, "data.json"),
      "utf-8"
    );
    res.json(JSON.parse(jsonData)); // Send the JSON data as response
  } catch (error) {
    console.error("Error reading JSON file:", error);
    res.status(500).json({ error: "Failed to read JSON file" });
  }
});

// Functions to access database
function addTable(TableQuery) {
  return new Promise((resolve, reject) => {
    // Execute the query to create the table
    pool.query(TableQuery, (err, result) => {
      if (err) {
        console.error("Error executing CREATE TABLE query:", err);
        reject(err);
      } else {
        console.log("Table created successfully");
        resolve(result);
      }
    });
  });
}

async function getTable(table_name) {
  try {
    // Execute the SQL query to select all rows from the menu_names table
    const result = await pool.query(`SELECT * FROM ${table_name}`);

    // Return the result.rows array, which contains all rows from the table
    return result.rows;
  } catch (error) {
    // Handle any errors
    console.error("Error selecting menus:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

function dropTable(TableQuery) {
  // Execute the query to drop the table
  pool.query(TableQuery, (err, result) => {
    if (err) {
      console.error("Error executing DROP TABLE query:", err);
    } else {
      console.log("Table dropped successfully");
    }
  });
}

async function updateData(objects) {
  try {
    // Clear the table
    await clearTable();

    // Define the SQL statement for the insert query
    const insertQuery = `
      INSERT INTO menu (prawns_menu, poultry_menu, prawn_products, poultry_products)
      VALUES ($1, $2, $3, $4)
    `;

    // Execute the insert query for each object
    const values = [
      objects.prawns_menu,
      objects.poultry_menu,
      objects.prawn_products,
      objects.poultry_products,
    ];

    // Insert data into the table
    const result = await pool.query(insertQuery, values);
    console.log("Data inserted successfully:", result);
  } catch (error) {
    console.error("Error inserting data:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

function clearTable() {
  return new Promise((resolve, reject) => {
    const truncateQuery = `TRUNCATE TABLE menu`;

    // Execute the query to clear the table
    pool.query(truncateQuery, (err, result) => {
      if (err) {
        console.error("Error truncating table:", err);
        reject(err);
      } else {
        console.log("Table data cleared successfully");
        resolve(result);
      }
    });
  });
}

function dropTable(TableQuery) {
  return new Promise((resolve, reject) => {
    // Execute the query to drop the table
    pool.query(TableQuery, (err, result) => {
      if (err) {
        console.error("Error executing DROP TABLE query:", err);
        reject(err);
      } else {
        console.log("Table dropped successfully");
        resolve(result);
      }
    });
  });
}

function checkTable(TableQuery) {
  return new Promise((resolve, reject) => {
    // Execute the query to check if the table exists
    pool.query(TableQuery, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        reject(err);
      } else {
        // Process the result here
        const tableExists = result.rows[0].exists;
        console.log(`Table exists:`, tableExists);
        resolve(tableExists);
      }
    });
  });
}

function checkDatabase() {
  return new Promise((resolve, reject) => {
    // Construct the SQL query to count the number of tables in the public schema
    const countTablesQuery = `
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public';`;

    // Execute the query to count the number of tables
    pool.query(countTablesQuery, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        reject(err);
      } else {
        // Process the result here
        const tableCount = parseInt(result.rows[0].count);
        if (tableCount === 0) {
          resolve("The database is empty.");
        } else {
          resolve(
            `The database is not empty. It contains ${tableCount} tables.`
          );
        }
      }
    });
  });
}

process.on("exit", () => {
  pool.end();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
