const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db"); // Adjust the path as necessary
var cors = require("cors");
const path = require("path");
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
connectDB();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images"))); // Serve images statically
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send({ message: "sccess" });
});

app.use("/api", require("./routes/adminRoutes"));
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/productRoutes"));
app.use("/api", require("./routes/categoriesRoutes"));
app.use('/api/public',require('./routes/publicRoutes'))
// Middleware to parse JSON bodies

app.listen(port, () => console.log(`server connnected on port ${port} `));
