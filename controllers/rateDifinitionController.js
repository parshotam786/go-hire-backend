const RateDefinition = require("../models/rateDifinitionModel");

// Add Rate Definition Controller
const createRateDefinition = async (req, res) => {
  const vendorId = req.user._id;
  try {
    const {
      name,
      description,
      companyName,
      rateEngine,
      rateType,
      isActive,
      dayRates,
      weekRate,
      dayRate,
      MonthlyRate,
      subsequentWeeksRate,
      subsequentDaysRate,
      weekendRate,
      useWholeWeekCharging,
      calendarDay,
      rentalDaysPerWeek,
      minimumRentalPeriod,
      leewayMinutes,
    } = req.body;

    const rateDefinition = new RateDefinition({
      vendorId: vendorId,
      name,
      description,
      companyName,
      rateEngine,
      rateType,
      isActive,
      dayRates,
      weekRate,
      dayRate,
      monthlyRate: MonthlyRate, // Ensure correct key format
      subsequentWeeksRate,
      subsequentDaysRate,
      weekendRate,
      useWholeWeekCharging,
      calendarDay,
      rentalDaysPerWeek,
      minimumRentalPeriod,
      leewayMinutes,
    });

    // Save the new rate definition
    const savedRateDefinition = await rateDefinition.save();

    // Log the saved rate definition
    console.log("Saved rate definition:", savedRateDefinition);

    // Send response
    return res.status(201).json({
      message: "Rate definition created successfully",
      data: savedRateDefinition,
    });
  } catch (error) {
    console.error("Error adding rate definition:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const getRateDefinitionController = async (req, res) => {
  const vendorId = req.user._id;
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    const searchQuery = {
      vendorId,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { rateEngine: { $regex: search, $options: "i" } },
      ],
    };

    const skip = (page - 1) * limit;

    const rateDefinitions = await RateDefinition.find(searchQuery)
      .select("name description isActive rateEngine _id")
      .skip(skip)
      .limit(parseInt(limit));

    // Count total documents for pagination
    const totalCount = await RateDefinition.countDocuments(searchQuery);

    // Send response with pagination info
    return res.status(200).json({
      success: true,
      message: "Rate definitions fetched successfully",
      data: rateDefinitions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching rate definitions:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const getRateDefinitionList = async (req, res) => {
  const vendorId = req.user._id;
  try {
    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    const rateDefinitions = await RateDefinition.find({
      vendorId,
      isActive: true,
    }).select("name _id");

    return res.status(200).json({
      success: true,
      message: "Rate definitions fetched successfully",
      data: rateDefinitions,
    });
  } catch (error) {
    console.error("Error fetching rate definitions:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const updateRateDefinition = async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  try {
    const {
      name,
      description,
      companyName,
      rateEngine,
      rateType,
      isActive,
      dayRates,
      weekRate,
      dayRate,
      MonthlyRate,
      subsequentWeeksRate,
      subsequentDaysRate,
      weekendRate,
      useWholeWeekCharging,
      calendarDay,
      rentalDaysPerWeek,
      minimumRentalPeriod,
      leewayMinutes,
    } = req.body;

    const rateDefinition = await RateDefinition.findOne({ _id: id, vendorId });

    if (!rateDefinition) {
      return res.status(404).json({ message: "Rate definition not found" });
    }

    // Update the fields with new values (if provided in the request)
    rateDefinition.name = name || rateDefinition.name;
    rateDefinition.description = description || rateDefinition.description;
    rateDefinition.companyName = companyName || rateDefinition.companyName;
    rateDefinition.rateEngine = rateEngine || rateDefinition.rateEngine;
    rateDefinition.rateType = rateType || rateDefinition.rateType;
    rateDefinition.isActive =
      isActive !== undefined ? isActive : rateDefinition.isActive;
    rateDefinition.dayRates = dayRates || rateDefinition.dayRates;
    rateDefinition.weekRate = weekRate || rateDefinition.weekRate;
    rateDefinition.dayRate = dayRate || rateDefinition.dayRate;
    rateDefinition.monthlyRate = MonthlyRate || rateDefinition.monthlyRate; // Use correct key format
    rateDefinition.subsequentWeeksRate =
      subsequentWeeksRate || rateDefinition.subsequentWeeksRate;
    rateDefinition.subsequentDaysRate =
      subsequentDaysRate || rateDefinition.subsequentDaysRate;
    rateDefinition.weekendRate = weekendRate || rateDefinition.weekendRate;
    rateDefinition.useWholeWeekCharging =
      useWholeWeekCharging !== undefined
        ? useWholeWeekCharging
        : rateDefinition.useWholeWeekCharging;
    rateDefinition.calendarDay = calendarDay || rateDefinition.calendarDay;
    rateDefinition.rentalDaysPerWeek =
      rentalDaysPerWeek || rateDefinition.rentalDaysPerWeek;
    rateDefinition.minimumRentalPeriod =
      minimumRentalPeriod || rateDefinition.minimumRentalPeriod;
    rateDefinition.leewayMinutes =
      leewayMinutes || rateDefinition.leewayMinutes;

    // Save the updated rate definition
    const updatedRateDefinition = await rateDefinition.save();

    // Return the updated document
    return res.status(200).json({
      message: "Rate definition updated successfully",
      data: updatedRateDefinition,
    });
  } catch (error) {
    console.error("Error updating rate definition:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const getRateDefinitionById = async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  try {
    // Find the rate definition by its id and ensure it belongs to the current vendor
    const rateDefinition = await RateDefinition.findOne({ _id: id, vendorId });

    if (!rateDefinition) {
      return res.status(404).json({ message: "Rate definition not found" });
    }

    // Send the found rate definition
    return res.status(200).json({
      message: "Rate definition fetched successfully",
      data: rateDefinition,
    });
  } catch (error) {
    console.error("Error fetching rate definition:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const deleteRateDefinitionController = async (req, res) => {
  try {
    const { id } = req.params;

    const rateDefinition = await RateDefinition.findById(id);
    if (!rateDefinition) {
      return res.status(404).json({ message: "Rate definition not found" });
    }

    await RateDefinition.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: "Rate definition deleted successfully" });
  } catch (error) {
    console.error("Error deleting rate definition:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the rate definition",
    });
  }
};
module.exports = {
  createRateDefinition,
  getRateDefinitionController,
  updateRateDefinition,
  getRateDefinitionById,
  deleteRateDefinitionController,
  getRateDefinitionList,
};
