const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db"); // Adjust the path as necessary
var cors = require("cors");
const path = require("path");
const { authenticateUser } = require("./utiles/userAccessMiddleware");
const port = process.env.PORT || 5000;
const routes = [
  "customersRoutes",
  "adminRoutes",
  "authRoutes",
  "productRoutes",
  "categoriesRoutes",
  "quickbookRoutes",
  "reviewRoutes",
  "BlogFeedBackRoutes",
  "importDataRoutes",
];
const app = express();
app.use(cors());
connectDB();
app.use(
  session({
    secret: "gohire22",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(express.json());
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/images", express.static(path.join(__dirname, "images"))); // Serve images statically
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send({ message: "sccess" });
});

routes.forEach((route) => {
  app.use("/api", require(`./routes/${route}`));
});

app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/order", authenticateUser, require("./routes/orderRoutes"));
app.use("/api/imports", authenticateUser, require("./routes/importBilkData"));
app.use(
  "/api/rate-definition",
  authenticateUser,
  require("./routes/rateDifinitionRoutes")
);
app.use("/api/document", authenticateUser, require("./routes/documentRoutes"));
app.use(
  "/api/tax-classes",
  authenticateUser,
  require("./routes/taxClassesRoutes")
);

// Middleware to parse JSON bodies

app.listen(port, () => console.log(`server connnected on port ${port} `));
