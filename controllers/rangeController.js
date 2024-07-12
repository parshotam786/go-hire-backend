const Range = require("../models/rangeModel");

const range = async (req, res) => {
    const currentRoute = req.path;
    console.log(`Request received on route: ${currentRoute}`);
    const { name } = req.body
    try {
        if (currentRoute == '/createRange') {
            if (!name) {
                return res.status(400).json({ error: "City Name is required" })
            }
            const newRange = await Range.create({ name })
            res.status(201).json(newRange)
        }
        else if (currentRoute == '/getAllRange') {
            const ranges = await Range.find()
            res.status(200).json(ranges)            
        }
        else if (currentRoute == '/getWeights') {
            const weights = await Range.find({ parentId: { $ne: null } })
            res.status(200).json(weights)
        }
        else if (currentRoute == '/getCities') {
            const cities = await Range.find({ parentId: null })
            res.status(200).json(cities)
        }
        else if (currentRoute == '/createWeight') {
            const { id } = req.query
            if (!name) {
                return res.status(400).json({ error: "Name is required" })
            }

            const existingRange = await Range.findById(id)
            if (!existingRange) {
                return res.status(400).json({ error: "Range not found" })
            }
            const obj = new Range({
                parentId: id,
                name
            })
            const response = await obj.save()
            res.status(201).json(response)
        }
        else if (currentRoute == '/getWeight') {
            const {  id } = req.query
            const ranges = await Range.find({ parentId: id })
            res.status(200).json(ranges)
        }
        else {
            return res.status(400).json({ error: "Route not found" })
        }
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

module.exports = {
    range
}