const Invoice = require("../models/invoiceModel");
const Vender = require("../models/venderModel");
const formatDate = require("../utiles/formatDate");

// POST API to create a new Invoice

exports.invoiceAddData = async (req, res) => {
  try {
    const { invoiceList, billingAddress } = req.body;

    // Calculate total price by summing up totalRentPrice from invoiceList
    const totalPrice = invoiceList.reduce(
      (sum, item) => sum + item.totalRentPrice,
      0
    );
    const date = new Date();
    const invoices = {
      products: invoiceList,
      invoiceDate: formatDate(date),
      InvoiceNumber: "INV-51451505",
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
      invoiceDate: savedInvoices.invoiceDate,
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
    const { page = 1, limit = 10, search } = req.query;

    // Build the query object
    const query = { "products.vendorId": id };

    if (search) {
      const searchRegex = new RegExp(search, "i"); // Case-insensitive search
      query.$or = [
        { email: searchRegex },
        { name: searchRegex },
        { invoiceDate: searchRegex },
        { InvoiceNumber: searchRegex },
      ];
    }

    // Calculate pagination parameters
    const skip = (page - 1) * limit;
    const invoices = await Invoice.find(query).skip(skip).limit(Number(limit));

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No invoices found!",
      });
    }

    // Get vendor details
    const vendor = await Vender.findOne({ _id: id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Extract the required fields from vendorAddress
    const vendorAddress = {
      street: vendor.street,
      city: vendor.city,
      state: vendor.state,
      zip: vendor.zip,
      country: vendor.country,
    };

    // Construct response payload
    const responsePayload = invoices.map((invoice) => ({
      id: invoice._id,
      totalPrice: invoice.products.reduce(
        (sum, item) => sum + item.totalRentPrice,
        0
      ),
      invoiceDate: invoice.invoiceDate,
      invoiceNumber: invoice.InvoiceNumber,
      vendorAddress: `${vendorAddress?.street},${vendorAddress?.city},${vendorAddress?.state},${vendorAddress?.zip},${vendorAddress?.country}`,
      billingAddress: {
        name: invoice.name,
        email: invoice.email,
        phone: invoice.phone,
        address: invoice.address,
        city: invoice.city,
        zip: invoice.zip,
        country: invoice.country,
      },
    }));

    const totalInvoices = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(totalInvoices / limit);

    res.status(200).json({
      success: true,
      totalPages,
      currentPage: +page,
      invoices: responsePayload,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the invoice by ID
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Get vendor details
    const vendor = await Vender.findOne({ _id: invoice.products[0].vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Extract the required fields from vendorAddress
    const vendorAddress = {
      street: vendor.street,
      city: vendor.city,
      state: vendor.state,
      zip: vendor.zip,
      country: vendor.country,
    };

    // Construct response payload
    const responsePayload = {
      success: true,
      invoiceList: invoice.products.map((product) => ({
        productName: product.productName,
        companyProductName: product.companyProductName,
        productDescription: product.productDescription,
        category: product.category,
        totalRentPrice: product.totalRentPrice,
        start_date: product.start_date,
        end_date: product.end_date,
        status: product.status,
        rentPrice: product.rentPrice,
        salePrice: product.salePrice,
        vendorId: product.vendorId,
        isActive: product.isActive,
        _id: product._id,
      })),
      id: invoice._id,
      totalPrice: invoice.products.reduce(
        (sum, item) => sum + item.totalRentPrice,
        0
      ),
      invoiceDate: invoice.invoiceDate,
      vendorAddress: `${vendorAddress?.street},${vendorAddress?.city},${vendorAddress?.state},${vendorAddress?.zip},${vendorAddress?.country}`,
      billingAddress: {
        name: invoice.name,
        email: invoice.email,
        phone: invoice.phone,
        address: invoice.address,
        city: invoice.city,
        zip: invoice.zip,
        country: invoice.country,
      },
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};
