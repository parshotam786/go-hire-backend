const {
  addCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} = require("../controllers/customersController");

const router = require("express").Router();

/**
 * @openapi
 * /api/customer/add:
 *   post:
 *     summary: Add a new customer
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               thumbnail:
 *                 type: string
 *                 example: "/images/default-image.png"
 *               number:
 *                 type: string
 *                 example: "1234567890"
 *               owner:
 *                 type: string
 *                 example: "Company Owner"
 *               stop:
 *                 type: boolean
 *                 example: false
 *               active:
 *                 type: boolean
 *                 example: true
 *               cashCustomer:
 *                 type: boolean
 *                 example: false
 *               canTakePayments:
 *                 type: boolean
 *                 example: true
 *               addressLine1:
 *                 type: string
 *                 example: "123 Main St"
 *               addressLine2:
 *                 type: string
 *                 example: "Suite 456"
 *               city:
 *                 type: string
 *                 example: "Anytown"
 *               country:
 *                 type: string
 *                 example: "Country"
 *               postCode:
 *                 type: string
 *                 example: "12345"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "email@example.com"
 *               fax:
 *                 type: string
 *                 example: "123-456-7890"
 *               telephone:
 *                 type: string
 *                 example: "098-765-4321"
 *               website:
 *                 type: string
 *                 example: "https://example.com"
 *               type:
 *                 type: string
 *                 example: "Individual"
 *               industry:
 *                 type: string
 *                 example: "Retail"
 *               status:
 *                 type: string
 *                 example: "Active"
 *               taxClass:
 *                 type: string
 *                 example: "Standard"
 *               parentAccount:
 *                 type: string
 *                 example: "Parent Account Name"
 *               invoiceRunCode:
 *                 type: string
 *                 example: "IR123"
 *               paymentTerm:
 *                 type: string
 *                 example: "Net 30"
 *               vendorId:
 *                 type: string
 *                 example: "60e73acfb61f8b1a30e1c9e8"
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "60e73acfb61f8b1a30e1c9e8"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "email@example.com"
 *                 phone:
 *                   type: string
 *                   example: "1234567890"
 *       400:
 *         description: Bad request
 */

router.post("/customer/add", addCustomer);

/**
 * @openapi
 * /api/customer:
 *   get:
 *     summary: Retrieve a list of customers
 *     tags:
 *       - Customer
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 */
router.get("/customer", getCustomer);

/**
 * @openapi
 * /api/customer/{id}:
 *   get:
 *     summary: Retrieve a customer by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the customer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *       404:
 *         description: Customer not found
 */
router.get("/customer/:id", getCustomerById);

/**
 * @openapi
 * /api/customer/{id}:
 *   put:
 *     summary: Update a customer by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the customer
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Customer not found
 */
router.put("/customer/:id", updateCustomer);

/**
 * @openapi
 * /api/customer/{id}:
 *   delete:
 *     summary: Delete a customer by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the customer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete("/customer/:id", deleteCustomer);

module.exports = router;
