const express = require("express");
const app = express();
require("dotenv").config();
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

// Define routes
app.get("/", (req, res) => {
  res.send("Express js on Vercel");
});

app.get("/get_data", async (req, res) => {
  try {
    const result = await getTable("menu");
    res.send(result);
  } catch (error) {
    res.status(500).send("Error occurred while checking database.");
  }
});

app.get("/get_cred", async (req, res) => {
  try {
    const cred = await getTable("login_credentials");
    res.send(cred);
  } catch (error) {
    res.status(500).send("Error occurred while checking database.");
  }
});

// Middleware to parse JSON bodies
app.use(express.json());

// Post requests
app.post("/send_data", (req, res) => {
  // Access the JSON data sent from the client
  const objects = req.body;
  updateData(objects);
  res.json({ message: "Data received successfully" });
});

app.post("/send_cred", (req, res) => {
  // Access the JSON data sent from the client
  const objects = req.body;
  updateData(objects);
  res.json({ message: "Data received successfully" });
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
