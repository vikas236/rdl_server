const express = require("express");
const cors = require("cors"); // Import cors
const app = express();

// Use cors middleware
app.use(cors());

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
