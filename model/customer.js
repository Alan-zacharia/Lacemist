const mongoose =require('mongoose')
const bcrypt = require('bcryptjs');
const { token } = require('morgan');

const userSchema = new mongoose.Schema({
   username: {
      type: String,
      required: true,
   },
   email: {
      type: String,
      required: true,
      lowercase:true
   },
   phone:{
      type:String,
      required:true,
   },
   password:{
      type:String,
      required:true,
      minlength:6
   },
   image : {
      type: String,
      default:''
   },


   address:{
      street:String,
      city:String,
      state:String,
      postalCode:String,
      country:String,
   },
   stateOrCity:{
      type:String,
   },
   pincodeOrZip:{
      type : Number ,
   },
   orderNotes:{
      type:String
   },

   createdAt:{
      type:Date,
      default : Date.now,
   },
   updatedAt:{
      type:Date,
      default: Date.now,
   },

   isActive:{
      type:Boolean,
      default:true,
   },
   isVerified:{
      type: Boolean,
      default:false
   },
   isBlocked:{
      type:Boolean,
      default:false
   },
   resetToken : {
      type : String
   },
   resetTokenExpire : {
      type : Date 
   }, Wallet:{
      type:Number,
      default:0
  },
  WalletTransaction:{
      type:Array
  },
  coupons:{
      type:Array
  },
  referalCode:{
      type: String
  }
});

const customerModel = mongoose.model('users',userSchema)

module.exports = {customerModel};