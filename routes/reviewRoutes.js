const {
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
} = require("../controllers/reviewsController");

const express = require("express");

const router = express.Router();

router.get("/reviews/:id", getProductReviews);
router.post("/reviews", addProductReview);
router.put("/reviews", updateProductReview);
router.delete("/reviews/:id", deleteProductReview);

module.exports = router;
