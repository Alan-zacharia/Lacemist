const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const addressSchema = new mongoose.Schema({
    user:{
        type:ObjectID,
        ref:'User',
        required:true
    },
    addresses:[{
        addressType: {
            type: String, 
            enum: ['home', 'work','temp'], 
        },
        HouseNo:{
            type:String,
          
        },
        Street:{
            type:String,
        },
        Landmark:{
            type:String,
        },
        pincode:{
            type:Number,
          
        },
        city:{
            type:String,
            
        },
        district:{
            type:String,
           
        },
        State:{
            type:String,
           
        },
        Country:{
            type:String,
           
        }

    }],

})

addressSchema.path('addresses').validate(function (value) {
    return value.length <= 3;
}, 'You can have a maximum of 3 addresses.');


const AddressModel = mongoose.model('Address',addressSchema);
module.exports ={AddressModel};