const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
      },
        productPrice:{
          type:Number,
        },
        price: {
          type:Number
        },
        quantity: {
          type: Number,
          required: true,
          min:[1, 'Quantity can not be less then 1.'],
          default: 1
          },
    }
  ]
});

const whislistModel =  mongoose.model('Wishlist', wishlistSchema);
module.exports = {whislistModel}
