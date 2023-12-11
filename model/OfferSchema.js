const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

const OfferModel = mongoose.model('Offer', offerSchema);
module.exports = {OfferModel};
