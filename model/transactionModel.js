const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const transactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = { transactionModel };
