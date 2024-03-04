const express = require("express");
const app = express();
const query = require("./query");

// Middleware to enable CORS
// app.use((req, res, next) => {
//   // Set the Access-Control-Allow-Origin header to allow requests from any origin
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   // Set other CORS headers as needed
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   // Call next middleware in the chain
//   next();
// });

// Define routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/get_data", (req, res) => {
  query.e.getTable("menu").then((result) => {
    res.send(result);
  });
});

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/send_data", (req, res) => {
  // Access the JSON data sent from the client
  const objects = req.body;
  query.e.updateData(objects);
  res.json({ message: "Data received successfully" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
