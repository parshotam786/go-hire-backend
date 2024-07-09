//  Public API for fetching (All Products, All Vendors, Verified Manufactures)

const Product = require("../models/productModel")
const venderModel = require("../models/venderModel")



exports.getAllFilterDataWithType=async(req, res)=>{
    const type=req?.body?.type 
    let data=[], totalRecords=0;
    // Pagination
    req.body.page= req.body.page ?? 1
    
   
    if(!type){
        return res.status(400).json({error:'Type is required, e.g:product, all-vendor, verified-manufacture'})
    }
    let filters={
        // Product Filters
        ...(type =='product' && {
            isActive:'Active',
            ...(req.body?.rating && {rating:req.body?.rating}), // rating
            // If type is product
            ...( (req?.body?.minPrice || req?.body?.maxPrice )&&{ rentPrice:(req?.body?.minPrice && req?.body?.maxPrice ) && {$gte:req?.body?.minPrice, $lte:req?.body?.maxPrice} || req?.body?.minPrice && {$gte:req?.body?.minPrice} ||
            req?.body?.maxPrice &&  {$lte:req?.body?.maxPrice}}), // min and max price (with or without range)
             ...(req.body?.categoryIds && {category:{$in:req.body?.categoryIds}})    
        
        }),
    
        // All Vendor Filters
        ...(type =='all-vendor' &&{
           status:"approved",
            role:"Seller",
            ...(req.body?.rating && {rating:req.body?.rating}), // rating
        }),

        // Verified Manufacture
        ...(type =='verified-manufacture' && {
            status:"approved",
            role:"Seller",
        })
    }
    if(type =='product'){
        console.log('fi',filters)

        data=await Product.find(filters)
        totalRecords=await Product.countDocuments(filters)
    }else if(type =='all-vendor'){
        data=await venderModel.find(filters)
        totalRecords=await venderModel.countDocuments(filters)


    }else if(type =='verified-manufacture'){
        data=await venderModel.find(filters)
        totalRecords=await venderModel.countDocuments(filters)

    }


    return res.send({data, totalRecords})

}