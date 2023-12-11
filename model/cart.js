const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
      },
      image:{
         type : String,
         required : true
      },
      name:{
        type : String,
        required : true
      },
        productPrice:{
          type:Number,
          
        },
        quantity: {
          type: Number,
          
          min:[1, 'Quantity can not be less then 1.'],
          default: 1
          },
        price: {
          type:Number
        },
        selected: {
          type: Boolean, 
          default: false, 
      },
   
    }
  ],
  billTotal :{
    type:Number
  }
  
});

const cartModel = mongoose.model('Cart', cartSchema);

module.exports ={ cartModel };