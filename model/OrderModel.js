const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectID = mongoose.Schema.Types.ObjectId;

const orderSchema = new Schema({
  user: {
    type: ObjectID,
    ref: 'users',
    required: true,
  },
  cart: {
    type: ObjectID,
    ref: 'Cart',
  },
  orderId :{
    type: String
  },
  paymentId : {
    type : String
  },
  items: [
    {
      productId: {
        type: ObjectID,
        ref: 'Product',
      },
      image: {
        type: String,
      },
      name: {
        type: String,
      },
      productPrice: {
        type: Number,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less than 1.'],
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  billTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Success', 'Failed'],
    default: 'Pending',
  },
  deliveryAddress: {
    type:{
    addressType: String,
    HouseNo: String,
    Street: String,
    Landmark: String,
    pincode: Number,
    city: String,
    district: String,
    State: String,
    Country: String,
  }
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum:['Pending','Processing', 'Shipped', 'Delivered','Canceled','Return','Request'],
    default: 'Pending'
},

},
{
    timestamps:true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
