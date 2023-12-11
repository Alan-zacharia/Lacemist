const express = require('express');
const router = express.Router();
const nocache = require('nocache');
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const {storage, upload} = require('../middleware/multer');
const Order=require('../controller/adminOrderManagement')
const {adminAuthentication} = require('../middleware/AdminAuth') 
const CouponExpiration = require('../middleware/CouponExpiration') 
router.use(nocache());

router.get('/dashboard',adminAuthentication,adminController.dashboard)

router.get('/',adminController.adminlogin);
router.post('/',adminController.adminloginpost);

// create-coupon
router.get('/create-coupon',CouponExpiration,adminAuthentication,adminController.couponGet)
router.post('/create-coupon',adminAuthentication,adminController.couponPost)
router.delete('/coupon-delete/:couponId',adminAuthentication,adminController.couponDelete)

//userManangement
router.get('/usermanagement',adminAuthentication,adminController.usermanagement);
router.post('/blockUser',adminAuthentication,adminController.userblock);

//produc management
router.get('/product-management',adminAuthentication,productController.productManagementGet)
router.post('/product-management/newProduct',adminAuthentication,upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]),productController.productManagementCreate)
router.get('/product-management/getCategories',adminAuthentication,productController.productCategories);
router.post('/product-management/editProduct/:Id',adminAuthentication,upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]),productController.productManagementEdit);
router.delete('/product-management/delete-product/:productId',adminAuthentication,productController.productManagementDelete);
router.post('/product-management/featuredProduct',adminAuthentication,productController.productManagementPublish);

//category management
router.get('/category-management',adminAuthentication,categoryController.categoryManagementGet);
router.post('/category-management/newCategory',adminAuthentication, upload.single('image'),categoryController.categoryManagementCreate)
router.post('/category-management/edit-category/:categoryId',adminAuthentication,upload.single('editImage'),categoryController.categoryManagementEdit)
router.post('/category-management/isFeatured',adminAuthentication,categoryController.categoryManagementFeatured)
router.post('/return-orderConfirmation/:orderId',adminAuthentication,Order.returnOrder)

//order management
router.get('/order-management',adminAuthentication,Order.OrderPageGet);
router.delete('/order-management/deleteOder/:orderId',adminAuthentication,Order.OrderDelete)
router.get('/order-management/orderDetailedView/:orderId',adminAuthentication,Order.orderDetailedView);
router.post('/order-management/update-order-status/:orderId',adminAuthentication,Order.updateOrderStatus)

//offer
router.get('/category-offer-create',adminAuthentication,categoryController.categoryOffer)
router.post('/category-offer-create',adminAuthentication,categoryController.categoryOfferPost)

//invoice
router.get('/generate-invoice',adminController.saleReport)
router.get('/generate-invoice-daily',adminController.saleDailyReport)
 
router.get('/logout',adminController.adminLogout);

module.exports = router;