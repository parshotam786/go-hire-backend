const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db"); // Adjust the path as necessary
var cors = require("cors");
const path = require("path");
const port = process.env.PORT || 5000;
const routes = [
  "customersRoutes",
  "adminRoutes",
  "authRoutes",
  "productRoutes",
  "categoriesRoutes",
  "reviewRoutes",
];
const app = express();
app.use(cors());
connectDB();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images"))); // Serve images statically
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send({ message: "sccess" });
});

routes.forEach((route) => {
  app.use("/api", require(`./routes/${route}`));
});

app.use("/api/public", require("./routes/publicRoutes"));

// Middleware to parse JSON bodies

app.listen(port, () => console.log(`server connnected on port ${port} `));
