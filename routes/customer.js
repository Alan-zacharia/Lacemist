const express = require("express");
const customerController=require('../controller/customerController');
const {userAuthentication} = require('../middleware/UserAuth')
const cartController = require('../controller/cartController');
const {storage, upload} = require('../middleware/multer');
const forgettPassword = require('../controller/forgettPassword');
const CouponExpiration = require('../middleware/CouponExpiration')
const {handle404Error} = require('../middleware/Error-handling');
const router  = express.Router();

//Guest Page
router.get('/',CouponExpiration,customerController.home,handle404Error);
router.get('/product',customerController.productDetails,handle404Error);
router.get('/product-shoes',customerController.shoes,handle404Error);
router.post('/resend',customerController.resendOtp,handle404Error)      
router.get('/login',customerController.loginPage,handle404Error)
router.post('/login',customerController.loginpost,handle404Error)
router.get('/signup',customerController.signuppage,handle404Error)
router.post('/signup',customerController.postRegister,handle404Error)

// OTP
router.get("/otp",customerController.loadOTP,handle404Error);
router.post('/postotp',customerController.postVerifyOtp,handle404Error);

//product detail
router.get('/product-details/:productId',customerController.productDetailedView)

// cart 
router.post("/addToCart",cartController.addtoCart,handle404Error);
router.get("/cart",userAuthentication,cartController.getCart,handle404Error);
router.delete("/cart/remove-product/:product",userAuthentication,cartController.cartRemove,handle404Error);
router.put("/cart/update-cart-quantity/:product",userAuthentication,cartController.cartPut,handle404Error);
router.patch('/cart/update-cart-total',userAuthentication,cartController.cartbillTotalUpdate,handle404Error)
router.get('/checkVerify',userAuthentication,cartController.checkverify,handle404Error)
router.get('/checkout',userAuthentication,cartController.checkoutGet,handle404Error)
router.post('/cart/checkout',userAuthentication,cartController.checkoutPost,handle404Error)
router.post('/cart/verify-payment',userAuthentication,cartController.razorpayVerify,handle404Error);
router.post('/coupon-apply',userAuthentication,cartController.CouponApply,handle404Error);

//Profile
router.get('/profile',userAuthentication,customerController.userProfileGet,handle404Error)
router.post('/profile/addAddress',userAuthentication,customerController.userAddAddress,handle404Error) 
router.delete('/profile/deleteAddress',userAuthentication,customerController.userRemoveaddress,handle404Error)
router.post('/profile/editAddress',userAuthentication,customerController.editAddress,handle404Error)
router.post('/edit-profile',userAuthentication,upload.single('profileImage'),customerController.EditProfile,handle404Error);
router.post('/profile/cancel-order/:orderId',userAuthentication, customerController.cancelOrder,handle404Error);
router.post('/profile/return-order/:orderId',userAuthentication, customerController.returnOrder,handle404Error);
router.get('/referal',userAuthentication,customerController.referal,handle404Error)

// whishlist
router.post('/whislist',cartController.addToWHislist,handle404Error)
router.get('/whislist-view',userAuthentication,cartController.whislistGet,handle404Error)
router.delete('/profile/remove-whislist/:product',userAuthentication,customerController.whislistRemove,handle404Error)
router.post('/add-toWhislistCart',userAuthentication,cartController.whishlistAddtoCart,handle404Error)
router.get('/wallet',userAuthentication,customerController.walletTransactions,handle404Error)

// forgott Password 
router.get('/forgot-password',forgettPassword.forgettPasswordGet,handle404Error)
router.post('/forgot-password',forgettPassword.forgettPasswordPost,handle404Error)
router.get('/newPassword',forgettPassword.newPassword,handle404Error)
router.get('/reset-password/:tokenId',forgettPassword.ResetPasswordGet,handle404Error);
router.post('/reset-password',forgettPassword.ResetPasswordPost,handle404Error);

//orders
router.get("/order-view/:orderId",userAuthentication,customerController.orderView,handle404Error);
router.get('/order-confirmation/:orderId',userAuthentication,cartController.orderConfirmation,handle404Error)
router.get('/Cutomer-orders',userAuthentication,customerController.CustumorOrder,handle404Error)
router.get('/download-invoice/:orderId',userAuthentication , customerController.Invoice,handle404Error)

router.get('/register',customerController.Referalparam,handle404Error)

// Logout
router.get("/logout",customerController.userLogout,handle404Error);

module.exports = router;