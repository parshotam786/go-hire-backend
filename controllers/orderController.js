const Order = require("../models/orderModel")

const getOrder=async(req,res)=>{

    const findOrder=await Order.find({orderId:req.params?.id})
    if(!findOrder){
        return res.status(404).send({error:"Order not found"})
    }
    return res.status(200).send({data:findOrder})

}

const getAllOrders=async(req,res)=>{

    const findOrders=await Order.find({orderId:req.params?.id})
    if(!findOrders){
        return res.status(404).send({error:"Orders not found"})
    }
    return res.status(200).send({data:findOrders})

}
const createOrder=async(req,res)=>{
    // const {}=req.body
req.body.orderId='ord1223'
    const create=new Order(req.body)
    const created=await create.save()
    if(created){
        return res.status(200).send({data:created, message:"Order created successfully", success:true})

    }

  

}

module.exports ={
getOrder,
createOrder,
getAllOrders
}