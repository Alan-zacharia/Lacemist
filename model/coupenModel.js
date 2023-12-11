const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

    couponCode: {
        type: String
    },
    validity: {
        type: Date,
        default: () => new Date() 
    },    
    minPurchase: {
        type: Number
    },
    minDiscountPercentage: {
        type: Number
    },
    discription: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    status : {
        type : String,
        enum : ['Cancel' , 'Active','Expires'],
        default : 'Active'
    },
    limit :{
        type :Number
    }
})

const Coupon = mongoose.model('Coupon', couponSchema)
module.exports = {
    Coupon
}