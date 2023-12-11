const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({

    adminEmail:{
       type:String,
       required: true
    },
    adminPassword:{
       type:String,
       required: true
    }
 })
 
 
module.exports = mongoose.model('Admin', adminSchema);
