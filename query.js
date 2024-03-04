// require("dotenv").config();
const pg = require("pg");

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const e = (() => {
  function addTable(TableQuery) {
    // Execute the query to create the table
    pool.query(TableQuery, (err, result) => {
      if (err) {
        console.error("Error executing CREATE TABLE query:", err);
      } else {
        console.log("Table created successfully");
      }
    });
  }

  async function updateData(objects) {
    await clearTable();

    // Define the SQL statement for the insert query
    const insertQuery = `INSERT INTO menu (prawns_menu, poultry_menu, prawn_products, poultry_products)
                            VALUES ($1, $2, $3, $4)`;

    // Execute the insert query for each object
    const values = [
      objects.prawns_menu,
      objects.poultry_menu,
      objects.prawn_products,
      objects.poultry_products,
    ];

    pool.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
      } else {
        console.log("Data inserted successfully");
      }
    });
  }

  function clearTable() {
    const truncateQuery = `TRUNCATE TABLE menu`;

    pool.query(truncateQuery, (err, result) => {
      if (err) {
        console.error("Error truncating table:", err);
      } else {
        console.log("Table data cleared successfully");
      }
    });
  }

  // Function to select all rows from the menu_names table
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

  function checkTable(TableQuery) {
    // Execute the query to check if the table exists
    pool.query(TableQuery, [table_name], (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
      } else {
        // Process the result here
        const tableExists = result.rows[0].exists;
        console.log(`Table ${table_name} exists:`, tableExists);
      }
    });
  }

  function checkDatabase() {
    // Construct the SQL query to count the number of tables in the public schema
    const countTablesQuery = `
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public';`;

    // Execute the query to count the number of tables
    pool.query(countTablesQuery, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
      } else {
        // Process the result here
        tableCount = parseInt(result.rows[0].count);
        if (tableCount === 0) {
          console.log("The database is empty.");
        } else {
          console.log(
            "The database is not empty. It contains",
            tableCount,
            "tables."
          );
        }
      }
      console.log("table count: " + tableCount);
    });
  }

  return {
    addTable,
    getTable,
    clearTable,
    updateData,
    dropTable,
    checkTable,
    checkDatabase,
  };
})();

// e.getTable("menu").then((e) => {
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
//   console.log(types);
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

function defaultResponse(req, res) {
  res.send("Express on Versel");
}

function getMenuNames(req, res) {
  res.send("data");
}

module.exports = { e };
