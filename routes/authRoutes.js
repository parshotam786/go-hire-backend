const router = require("express").Router();
const {
  AdminLogin,
  AdminRegister,
  AdminDirectory,
  VenderRegister,
  UserProfile,
  VenderLogin,
  updateVenderStatus,
  VenderDirectory,
  updateProfilePicture,
  getProfilePicture,
  updateUserdata,
  updateVendorStatus,
  removeVenderAccount,
  getVendorDashboardStats,
  updateBrandLogo,
  getBrandLogo,
} = require("../controllers/authController");
const {
  invoiceAddData,
  GetInvoiceListById,
  getInvoiceById,
  deleteInvoice,
} = require("../controllers/invoiceController");
const {
  addProduct,
  ProductList,
  getProductsByVendorId,
  removeProduct,
} = require("../controllers/productController");
const allowedRoles = require("../utiles/allowRoles");
const { authenticateUser } = require("../utiles/userAccessMiddleware");

// Admin Registration
/**
 * @openapi
 * /admin-register:
 *   post:
 *     summary: Register a new admin
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/admin-register", AdminRegister);

// Admin Login
/**
 * @openapi
 * /admin-login:
 *   post:
 *     summary: Admin login
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post("/admin-login", AdminLogin);

// Vendor Registration
/**
 * @openapi
 * /vender-register:
 *   post:
 *     summary: Register a new vendor
 *     tags:
 *       - Vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/vender-register", VenderRegister);

// Vendor Login
/**
 * @openapi
 * /vender-login:
 *   post:
 *     summary: Vendor login
 *     tags:
 *       - Vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post("/vender-login", VenderLogin);

// Update Vendor Status
/**
 * @openapi
 * /vender/status:
 *   post:
 *     summary: Update the status of a vendor
 *     tags:
 *       - Vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor status updated successfully
 *       400:
 *         description: Bad request
 */
router.post("/vender/status", updateVenderStatus);

// Get Admin Directory
/**
 * @openapi
 * /admin-directory:
 *   get:
 *     summary: Get a list of admins
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: List of admins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 */
router.get("/admin-directory", AdminDirectory);

// Get Vendor Directory
/**
 * @openapi
 * /vender-directory:
 *   get:
 *     summary: Get a list of vendors
 *     tags:
 *       - Vendor
 *     responses:
 *       200:
 *         description: List of vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 */
router.get("/vender-directory", VenderDirectory);

// Get Vendor Profile
/**
 * @openapi
 * /vender/profile/{id}:
 *   get:
 *     summary: Get profile of a specific vendor
 *     tags:
 *       - Vendor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 */
router.get("/vender/profile/:id", UserProfile);

// Update Vendor Profile Picture
/**
 * @openapi
 * /vender/profile-picture/{id}:
 *   put:
 *     summary: Update the profile picture of a vendor
 *     tags:
 *       - Vendor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/vender/profile-picture/:id", updateProfilePicture);

// Update Vendor Brand Logo
/**
 * @openapi
 * /vender/brand-logo/{id}:
 *   put:
 *     summary: Update the brand logo of a vendor
 *     tags:
 *       - Vendor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brandLogo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Brand logo updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/vender/brand-logo/:id", updateBrandLogo);

// Remove Vendor Account
/**
 * @openapi
 * /vender/{id}:
 *   delete:
 *     summary: Remove a vendor account
 *     tags:
 *       - Vendor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor account removed successfully
 *       404:
 *         description: Vendor not found
 */
router.delete("/vender/:id", removeVenderAccount);

// Update Vendor User Data
/**
 * @openapi
 * /vender/{id}:
 *   put:
 *     summary: Update data of a specific vendor
 *     tags:
 *       - Vendor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor data updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/vender/:id", updateUserdata);

// Update Vendor Status
/**
 * @openapi
 * /vender/update-status/{id}:
 *   put:
 *     summary: Update the status of a vendor
 *     tags:
 *       - Vendor
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor status updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/vender/update-status/:id", updateVendorStatus);

// Add Invoice Data
/**
 * @openapi
 * /vender/invoice:
 *   post:
 *     summary: Add invoice data for a vendor
 *     tags:
 *       - Invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Invoice data added successfully
 *       400:
 *         description: Bad request
 */
router.post("/vender/invoice", invoiceAddData);

// Get Invoice List by ID
/**
 * @openapi
 * /vender/invoice/list/{id}:
 *   get:
 *     summary: Get a list of invoices by vendor ID
 *     tags:
 *       - Invoice
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the vendor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                     format: float
 *                   date:
 *                     type: string
 *                     format: date
 */
router.get("/vender/invoice/list/:id", GetInvoiceListById);

// Get Invoice by ID
/**
 * @openapi
 * /vender/invoice/list/view/{id}:
 *   get:
 *     summary: Get an invoice by ID
 *     tags:
 *       - Invoice
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the invoice
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 amount:
 *                   type: number
 *                   format: float
 *                 date:
 *                   type: string
 *                   format: date
 *       404:
 *         description: Invoice not found
 */
router.get("/vender/invoice/list/view/:id", getInvoiceById);

// Delete Invoice
/**
 * @openapi
 * /vender/invoice/list/view/{id}:
 *   delete:
 *     summary: Delete an invoice by ID
 *     tags:
 *       - Invoice
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the invoice
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 */
router.delete("/vender/invoice/list/view/:id", deleteInvoice);

// Vendor Dashboard Stats
/**
 * @openapi
 * /vendor/stats:
 *   get:
 *     summary: Get vendor dashboard statistics
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sales:
 *                   type: number
 *                   format: float
 *                 orders:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/vendor/stats",
  authenticateUser,
  require("./orderRoutes"),
  allowedRoles(["Seller"]),
  getVendorDashboardStats
);

module.exports = router;
