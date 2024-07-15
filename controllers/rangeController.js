const Range = require("../models/rangeModel");
const XLSX = require("xlsx");

// const range = async (req, res) => {
//     const currentRoute = req.path;
//     console.log(`Request received on route: ${currentRoute}`);
//     const { name } = req.body
//     try {
//         if (currentRoute == '/createRange') {
//             if (!name) {
//                 return res.status(400).json({ error: "City Name is required" })
//             }
//             const newRange = await Range.create({ name })
//             res.status(201).json(newRange)
//         }
//         else if (currentRoute == '/getAllRange') {
//             const ranges = await Range.find()
//             res.status(200).json(ranges)            
//         }
//         else if (currentRoute == '/getWeights') {
//             const weights = await Range.find({ parentId: { $ne: null } })
//             res.status(200).json(weights)
//         }
//         else if (currentRoute == '/getCities') {
//             const cities = await Range.find({ parentId: null })
//             res.status(200).json(cities)
//         }
//         else if (currentRoute == '/createWeight') {
//             const { id } = req.query
//             if (!name) {
//                 return res.status(400).json({ error: "Name is required" })
//             }

//             const existingRange = await Range.findById(id)
//             if (!existingRange) {
//                 return res.status(400).json({ error: "Range not found" })
//             }
//             const obj = new Range({
//                 parentId: id,
//                 name
//             })
//             const response = await obj.save()
//             res.status(201).json(response)
//         }
//         else if (currentRoute == '/getWeight') {
//             const {  id } = req.query
//             const ranges = await Range.find({ parentId: id })
//             res.status(200).json(ranges)
//         }
//         else {
//             return res.status(400).json({ error: "Route not found" })
//         }
//     } catch (error) {
//         return res.status(500).json({ error: error.message })
//     }
// }

const getRange = async (req, res) => {
    const {  id } = req.query
    
    try {
        if (id == undefined) {
            const cities = await Range.find({ parentId: null })
            res.status(200).json(cities)
        }
        else if (id != undefined) {
            const ranges = await Range.find({ parentId: id })
            res.status(200).json(ranges)
        }
        else {
            return res.status(400).json({ message: "Route not found" })
        }
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const addRange = async (req, res) => {
    const { name } = req.body
    const {  id } = req.query

    try {
        if (id == undefined) {
            if (!name) {
                return res.status(400).json({ message: "Range is required" })
            }
            const _findName = await Range.findOne({ name })
            if (_findName) {
                return res.status(400).json({ message: "Range name already exist" })
            }
            const newRange = await Range.create({ name })
            res.status(201).json(newRange)
        }
        else if (id != undefined) {
            if (!name) {
                return res.status(400).json({ message: "VAT is required" })
            }

            const existingRange = await Range.findById(id)
            if (!existingRange) {
                return res.status(400).json({ message: "Range not found" })
            }
            const _findName = await Range.findOne({ name })
            if (_findName) {
                return res.status(400).json({ message: "Range name already exist" })
            }
            const obj = new Range({
                parentId: id,
                name
            })
            const response = await obj.save()
            res.status(201).json(response)
        }
        else {
            return res.status(400).json({ message: "Route not found" })
        }
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const _multiData = async (req, res) => {
    // console.log('req file', req.file); // Log the uploaded file object
    try {
        const filePath = req.file.buffer;
        if (!filePath) {
            return res.status(400).json({ message: "File is required" })
        }
        await importExcelDatatoMongodb(filePath);
        res.status(200).json({ message: 'File Uploaded', file: req.file?.originalname })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const importExcelDatatoMongodb = async (fileBuffer) => {
    try {
        // parse file
        // const workBook = XLSX.readFile(filePath);
        // Convert buffer to workbook
        const workBook = XLSX.read(fileBuffer);
        const sheetName = workBook.SheetNames[0];
        const sheet = workBook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // insert data in mongodb
        await Range.insertMany(data);
        console.log("Data imported successfully!")
    } catch (error) {
        console.log("Error importing data", error)
    }
}

module.exports = {
    // range
    getRange,
    addRange,
    _multiData
}