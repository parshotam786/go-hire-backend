const { default: mongoose } = require("mongoose");
const productReviewModel = require("../models/productReviewModel");
const { errorResponse, successResponse } = require("../utiles/responses");

exports.getProductReviews = async (req, res) => {
  const { id: product_id } = req.params;
  try {
    const reviews = await productReviewModel.find({ product_id });

    return successResponse(res, { data: reviews });
  } catch (error) {
    return errorResponse(res, { message: "Server Error", data: error });
  }
};

exports.addProductReview = async (req, res) => {
  const { rating, title, description } = req.body;
  if (!title || !description) {
    return errorResponse(res, {
      message: !title
        ? "Review title is required!"
        : "Review description is required!",
    });
  }

  try {
    // const isProduct = await Product.findById(productId);

    // if (!isProduct) {
    //   return res
    //     .status(404)
    //     .json({ message: "product not found or removed!", success: false });
    // }

    // for now adding dummy user and product when code merges user_id will be taken from token and productId will be from body
    const productId = new mongoose.Types.ObjectId("60d5ec49f2914c001c8e4d1a");
    const userId = new mongoose.Types.ObjectId("60d5ec49f2914c001c8e4d1b");

    const images = req.files.map((file) => file.path);

    const newReview = new productReviewModel({
      title,
      description,
      rating,
      images,
      product_id: productId,
      user_id: userId,
    });

    const reviewData = await newReview.save();

    return successResponse(res, {
      message: "review added successfully.",
      data: reviewData,
      code: 201,
    });
  } catch (error) {
    return errorResponse(res, { message: "Server Error", data: error });
  }
};

exports.updateProductReview = async (req, res) => {
  const { title, description, rating, _id } = req.body;
  if (!title || !description) {
    return errorResponse(res, {
      message: `${!title ? "title" : "description"} is required!`,
    });
  }

  try {
    const prevImages = await productReviewModel.findById(_id);

    let images =
      req.files && req.files.length > 0
        ? prevImages.images.concat(req.files.map((file) => file.path))
        : prevImages.images;

    const updatedReview = await productReviewModel.findByIdAndUpdate(
      _id,
      { title, description, rating, images },
      { new: true }
    );

    return successResponse(res, {
      message: "review updated successfully.",
      data: updatedReview,
    });
  } catch (error) {
    return errorResponse(res, { message: "Server Error", data: error });
  }
};

exports.deleteProductReview = async (req, res) => {
  const { id: reviewId } = req.params;
  try {
    if (!reviewId) {
      return errorResponse(res, { message: "invalid feild review id" });
    }

    const deletedReview = await productReviewModel.findByIdAndDelete(reviewId, {
      new: true,
    });

    return successResponse(res, {
      message: "review deleted successfully.",
      data: deletedReview,
    });
  } catch (error) {
    return errorResponse(res, { message: "Server Error", data: error });
  }
};

exports.deleteReviewImage = async (req, res) => {
  const { image_url } = req.body;

  const id = req.params.id;

  try {
    const reviews = await productReviewModel.findById(id);

    if (!reviews) {
      return errorResponse(res, { message: "review not found!", code: 404 });
    }

    reviews.images = reviews.images.filter((img) => img !== image_url);

    await reviews.save();

    return successResponse(res, { message: "image deleted successfully." });
  } catch (error) {}
};
