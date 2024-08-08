const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db"); // Adjust the path as necessary
var cors = require("cors");
const path = require("path");
const { authenticateUser } = require("./utiles/userAccessMiddleware");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swaggerOptions');
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
// Set up Swagger UI
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "images"))); // Serve images statically
app.use(express.urlencoded({ extended: false }));



routes.forEach((route) => {
  app.use("/api", require(`./routes/${route}`));
});

app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/order", authenticateUser, require("./routes/orderRoutes"));
app.use("/api/document", authenticateUser, require("./routes/documentRoutes"));

// Middleware to parse JSON bodies

app.listen(port, () => console.log(`server connnected on port ${port} `));
