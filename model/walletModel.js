const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 

    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Transaction', 
        },
    ],
});
const walletModel = mongoose.model('Wallet', walletSchema);
module.exports =  { walletModel }
