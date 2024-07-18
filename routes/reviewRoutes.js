const {
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  deleteReviewImage,
} = require("../controllers/reviewsController");

const express = require("express");
const upload = require("../utiles/multerConfig");

const router = express.Router();

router.get("/reviews/:id", getProductReviews);
router.post("/reviews", upload.array("image", 5), addProductReview);
router.put("/reviews", upload.array("image", 5), updateProductReview);
router.delete("/reviews/:id", deleteProductReview);
router.delete("/reviews/image/:id", deleteReviewImage);

module.exports = router;
