const Order = require("../models/orderModel")
const generateAlphanumericId = (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}
const getOrder = async (req, res) => {

    // const findOrder = await Order.find({ orderId: req.params?.id })
    const findOrder = await Order.find(req.params?.id)

    if (!findOrder) {
        return res.status(404).json({ error: "Order not found" })
    }
    return res.status(200).json({ data: findOrder })

}

const getAllOrders = async (req, res) => {
    const findOrders = await Order.find()
    if (!findOrders) {
        return res.status(404).json({ error: "Orders not found" })
    }
    return res.status(200).json({ data: findOrders, user: req?.user ?? null })

}
const createOrder = async (req, res) => {
    const { account, vendorId, customerId } = req.body

    // const validation = {
    //     account, vendorId, customerId
    // }
    // for (let key in validation) {
    //     if (validation[key]) {
    //         return res.status(400).json({ error: `${key} is missing` })
    //     }
    // }

    req.body.orderId = generateAlphanumericId()
    const create = new Order(req.body)
    const created = await create.save()
    if (created) {
        return res.status(200).json({ data: created, message: "Order created successfully", success: true })

    }


}

const addProductInOrder = async (req, res) => {
    const { orderId, ...rest } = req?.body

    const validation = {
        "orderId": orderId,
        "quantity": rest?.quantity,
        "rate": rest?.rate,
        "price": rest?.price,
        "product": rest?.product
    }
    for (let key in validation) {
        if (!validation[key]) {
            return res.status(400).json({ error: `${key} is missing` })
        }

        if (['price', 'quantity'].includes(key) && validation[key] <= 0) {
            return res.status(400).json({ error: `${key} must be greater than 0` })
        }
    }
    if (!orderId) {
        return res.status(400).json({ error: "OrderId is missing" })
    }

    try {
        const updated = await Order.findOneAndUpdate({ _id: orderId }, { $addToSet: { products: {...rest, status:'allocated'} } },
            { new: true })
        if (updated) {
            return res.status(200).json({ data: updated })
        }
    } catch (error) {
        res.status(500).json({
            message: "Failed to add product in order",
            error: error.message,
        });
    }

}

module.exports = {
    getOrder,
    createOrder,
    getAllOrders,
    addProductInOrder
}