const Invoice = require("../models/invoiceModel");
const Vender = require("../models/venderModel");

// POST API to create a new Invoice

exports.invoiceAddData = async (req, res) => {
  try {
    const { invoiceList, billingAddress } = req.body;

    // Calculate total price by summing up totalRentPrice from invoiceList
    const totalPrice = invoiceList.reduce(
      (sum, item) => sum + item.totalRentPrice,
      0
    );

    const invoices = {
      products: invoiceList,
      address: billingAddress.address,
      city: billingAddress.city,
      country: billingAddress.country,
      email: billingAddress.email,
      name: billingAddress.name,
      phone: billingAddress.phone,
      zip: billingAddress.zip,
    };
    const vendor = await Vender.findOne({
      vendorId: invoiceList.vendorId,
    }).populate();

    // Extract the required fields from vendorAddress
    const vendorAddress = {
      street: vendor.street,
      city: vendor.city,
      state: vendor.state,
      zip: vendor.zip,
      country: vendor.country,
    };

    const savedInvoices = new Invoice(invoices);
    await savedInvoices.save();

    const responsePayload = {
      success: true,
      invoiceList: savedInvoices.products,
      id: savedInvoices.id,
      totalPrice: totalPrice,
      invoiceDate: new Date().toJSON().slice(0, 10),
      vendorAddress: `${vendorAddress?.street},${vendorAddress?.city},${vendorAddress?.state},${vendorAddress?.zip},${vendorAddress?.country}`,
      billingAddress: {
        name: billingAddress.name,
        email: billingAddress.email,
        phone: billingAddress.phone,
        address: billingAddress.address,
        city: billingAddress.city,
        zip: billingAddress.zip,
        country: billingAddress.country,
      },
    };

    res.status(201).json(responsePayload);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create invoices",
      error: error.message,
    });
  }
};

exports.GetInvoiceListById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    const invoiceList = await Invoice.find({ vendorId: id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: invoiceList,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching products", details: error.message });
  }
};
