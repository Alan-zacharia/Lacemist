const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String, 
    },
    isFeatured:{
      type:Boolean,
      default:true
    },
    offer:{
      type:String,
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  }, {
    timestamps: true
  });
  
let CategoryModel = mongoose.model('Category',categorySchema);
module.exports = CategoryModel