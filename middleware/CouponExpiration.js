const cron = require('node-cron');
const {Coupon}  = require('../model/coupenModel');

const expireCoupons = async (req, res, next) => {
    try {
        const currentDate = new Date();
        const expiredCoupons = await Coupon.find({ validity: { $lte: currentDate } , status : 'Active' });
        if (expiredCoupons.length > 0) {
            await Coupon.updateMany(
                { _id: { $in: expiredCoupons.map(coupon => coupon._id) } },
                { $set: { status: 'Expires' } }
            );
            console.log('Expired coupons updated:', expiredCoupons.length);
        }
        if (next) {
            next();
        }
    } catch (err) {
        console.error('Error expiring coupons:', err);
        if (next) {
            next(err);
        }
    }
};

cron.schedule('0 0 * * *', async () => {
    console.log('Running coupon expiration task...');
    await expireCoupons();
});

module.exports = expireCoupons;
