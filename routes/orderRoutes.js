const express = require("express");
const {
  getOrder,
  createOrder,
  getAllOrders,
  addProductInOrder,
  deleteCustomerOrder,
  deleteProductFromOrder,
  getOrderProduct,
  allocateOrderProducts,
  updateOrderProduct,
  generateOrderInvoice,
  bookOrderInvoice,
  updateOrder,
  orderBookOut,
  orderBookIn,
  generateOrderNote,
} = require("../controllers/orderController");
const allowedRoles = require("../utiles/allowRoles");

const router = express.Router();

/**
 * @openapi
 * /api/order/get-all-orders:
 *   get:
 *     summary: Retrieve all orders
 *     tags:
 *       - Order
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   customerId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   totalAmount:
 *                     type: number
 *                     format: float
 */
router.get("/get-all-orders", getAllOrders);

/**
 * @openapi
 * /api/order/{id}:
 *   get:
 *     summary: Retrieve an order by ID
 *     tags:
 *       - Order
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the order
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *       404:
 *         description: Order not found
 */
router.get("/:id", getOrder);

/**
 * @openapi
 * /create-order:
 *   post:
 *     summary: Create a new order
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *       400:
 *         description: Bad request
 */
router.post("/create-order", createOrder);

/**
 * @openapi
 * /update-order/{id}:
 *   put:
 *     summary: Update an order by ID
 *     tags:
 *       - Order
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the order
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
 *               totalAmount:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 */
router.put("/update-order/:id", updateOrder);

/**
 * @openapi
 * /update-products:
 *   patch:
 *     summary: Add products to an order
 *     tags:
 *       - Order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Products added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 */
router.patch("/update-products", allowedRoles(["Seller"]), addProductInOrder);

/**
 * @openapi
 * /product/{id}:
 *   get:
 *     summary: Retrieve a product in an order by product ID
 *     tags:
 *       - Order
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *       404:
 *         description: Product not found
 */
router.get("/product/:id", getOrderProduct);

/**
 * @openapi
 * /product:
 *   put:
 *     summary: Remove a product from an order
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order or product not found
 */
router.put("/product", deleteProductFromOrder);

/**
 * @openapi
 * /customer:
 *   put:
 *     summary: Remove a customer order
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer order removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order or customer not found
 */
router.put("/customer", deleteCustomerOrder);

/**
 * @openapi
 * /product/status:
 *   put:
 *     summary: Allocate products in an order
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     status:
 *                       type: string
 *     responses:
 *       200:
 *         description: Products allocated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order or product not found
 */
router.put("/product/status", allocateOrderProducts);

/**
 * @openapi
 * /update-product-items:
 *   put:
 *     summary: Update product details in an order
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Product details updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order or product not found
 */
router.put("/update-product-items", updateOrderProduct);

/**
 * @openapi
 * /book:
 *   post:
 *     summary: Book an order invoice
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               invoiceDetails:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   amount:
 *                     type: number
 *                     format: float
 *     responses:
 *       201:
 *         description: Invoice booked successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 */
router.post("/book", bookOrderInvoice);

/**
 * @openapi
 * /invoice:
 *   post:
 *     summary: Generate an order invoice
 *     tags:
 *       - Order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               invoiceDetails:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   amount:
 *                     type: number
 *                     format: float
 *     responses:
 *       201:
 *         description: Invoice generated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Order not found
 */
router.post("/invoice", generateOrderInvoice);
router.post("/bookout", orderBookOut);
router.post("/bookin", orderBookIn);
router.post("/generate-order-note", generateOrderNote);

module.exports = router;
