const setVendorId = (req, res, next) => {
  try {
    const { role, _id, vendor } = req.user?._doc || {};
    req.vendorId = ["Seller", "Admin"].includes(role) ? _id : vendor;

    if (!req.vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    next();
  } catch (error) {
    console.error("Error setting vendor ID:", error);
    res.status(500).json({ message: "Error setting vendor ID" });
  }
};

// Add middleware to the application
app.use(setVendorId);
