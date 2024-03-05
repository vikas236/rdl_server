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
  // Set the Access-Control-Allow-Origin header to allow requests from your frontend domain
  res.setHeader("Access-Control-Allow-Origin", "https://reddydrugs.org/");
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

// app.get("/get_cred", async (req, res) => {
//   try {
//     const cred = await getTable("login_credentials");
//     res.send(cred);
//   } catch (error) {
//     res.status(500).send("Error occurred while checking database.");
//   }
// });

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/send_data", (req, res) => {
  // Access the JSON data sent from the client
  const objects = req.body;
  updateData(objects);
  res.json({ message: "Data received successfully" });
});

// function addTable(TableQuery) {
//   // Execute the query to create the table
//   pool.query(TableQuery, (err, result) => {
//     if (err) {
//       console.error("Error executing CREATE TABLE query:", err);
//     } else {
//       console.log("Table created successfully");
//     }
//   });
// }

// async function updateData(objects) {
//   await clearTable();

//   // Define the SQL statement for the insert query
//   const insertQuery = `INSERT INTO menu (prawns_menu, poultry_menu, prawn_products, poultry_products)
//                           VALUES ($1, $2, $3, $4)`;

//   // Execute the insert query for each object
//   const values = [
//     objects.prawns_menu,
//     objects.poultry_menu,
//     objects.prawn_products,
//     objects.poultry_products,
//   ];

//   pool.query(insertQuery, values, (err, result) => {
//     if (err) {
//       console.error("Error inserting data:", err);
//     } else {
//       console.log("Data inserted successfully");
//     }
//   });
// }

//   function clearTable() {
//     const truncateQuery = `TRUNCATE TABLE menu`;

//     pool.query(truncateQuery, (err, result) => {
//       if (err) {
//         console.error("Error truncating table:", err);
//       } else {
//         console.log("Table data cleared successfully");
//       }
//     });
//   }

//   // Function to select all rows from the menu_names table
//   async function getTable(table_name) {
//     try {
//       // Execute the SQL query to select all rows from the menu_names table
//       const result = await pool.query(`SELECT * FROM ${table_name}`);

//       // Return the result.rows array, which contains all rows from the table
//       return result.rows;
//     } catch (error) {
//       // Handle any errors
//       console.error("Error selecting menus:", error);
//       throw error; // Re-throw the error to be handled by the caller
//     }
//   }

//   function dropTable(TableQuery) {
//     // Execute the query to drop the table
//     pool.query(TableQuery, (err, result) => {
//       if (err) {
//         console.error("Error executing DROP TABLE query:", err);
//       } else {
//         console.log("Table dropped successfully");
//       }
//     });
//   }

//   function checkTable(TableQuery) {
//     // Execute the query to check if the table exists
//     pool.query(TableQuery, [table_name], (err, result) => {
//       if (err) {
//         console.error("Error executing query:", err);
//       } else {
//         // Process the result here
//         const tableExists = result.rows[0].exists;
//         console.log(`Table ${table_name} exists:`, tableExists);
//       }
//     });
//   }

// function checkDatabase() {
//   // Construct the SQL query to count the number of tables in the public schema
//   const countTablesQuery = `
//   SELECT COUNT(*)
//   FROM information_schema.tables
//   WHERE table_schema = 'public';`;

//   // Execute the query to count the number of tables
//   pool.query(countTablesQuery, (err, result) => {
//     if (err) {
//       console.error("Error executing query:", err);
//     } else {
//       // Process the result here
//       tableCount = parseInt(result.rows[0].count);
//       if (tableCount === 0) {
//         return "The database is empty.";
//       } else {
//         return "The database is not empty. It contains", tableCount, "tables.";
//       }
//     }
//   });
// }

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

// getTable("menu").then((e) => {
//   const obj = e[0].prawn_products;
//   const keys = Object.keys(obj);
//   const values = Object.values(obj);

//   const types = [];
//   values.forEach((o) => {
//     arr = Object.keys(o);
//     arr.forEach((t) => {
//       if (!types.includes("minerals")) types.push(t);
//     });
//   });
//   res.send(types);
// });
// e.addTable(`
//  CREATE TABLE IF NOT EXISTS menu (
//    prawns_menu JSONB,
//    poultry_menu JSONB,
//    prawn_products JSONB,
//    poultry_products JSONB
//  );
//  `);
// e.dropTable("DROP TABLE menu");

process.on("exit", () => {
  pool.end();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
