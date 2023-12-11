const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    productName: {
       type: String,
    
    },
 
    description: {
       type: String,
       
    },
 
    image: {
       type: String,
       default:''
       
    },
 
    images:[{
       type:String
    }],
 
    brand:{ 
       type:String
    },
 
    countInStock: {
       type: Number,
      
       min: 0,
       max: 300
    },
 
    rating: {
       type: Number,
       default: 0, 
    },
 
    isFeatured: {
       type: Boolean,
       default: true
    },
    
    category: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Category',
       
    },
 
    price: {
       type: Number,
       default: 0,
 
    },
    offer: { 
      type: Number, 
      default: 0 
   },
    offerExpire: { 
      type: Date, 
   },
    
    oldPrice: { 
      type: Number, 
   },
    
 }, {
    timestamps: true
 })
const productModel = mongoose.model('Product', productSchema);
module.exports = { productModel }
