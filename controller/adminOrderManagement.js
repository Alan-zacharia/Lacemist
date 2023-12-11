
const Product  = require('../model/product');
const Category = require('../model/category');
const mongoose = require('mongoose')
const AddressModel = require('../model/addressModel');
const OrderModel = require('../model/OrderModel');
const { customerModel } = require('../model/customer');

exports.OrderPageGet = async (req, res) => {
    const Items_Page = 6;

    try {
        let page = req.query.page || 1;
        let search = req.query.search || '';
        const totalOrders = await OrderModel.countDocuments();
        const totalPages = Math.ceil(totalOrders / Items_Page);
        const skip = (page - 1) * Items_Page;

        const orders = await OrderModel.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username')
            .skip(skip)
            .limit(Items_Page)
            .exec();
        const userDetail = await customerModel.findOne({ _id: orders[0].user });
        function getStatusColorClass(status) {
            if (status == "Canceled") {
                return "status-red";
            } else if (status == "Delivered") {
                return "status-blue";
            } else if (status == "Pending") {
                return "status-orange";
            } else {
                return "status-green";
            }
        }
        res.render("admin-order", {
            orders,
            userDetail,
            getStatusColorClass,
            totalPages,
            currentPage: page,
            search,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error")
    }
};

exports.OrderManagementPageGet = async (req, res) => {
    try {
      console.log("djssfgusdhgfedghkdhgfdhf");
      const orders = await OrderModel.find()
        .sort({ createdAt: -1 })
        .populate('user', 'name')
        .exec();
        const userDetail = await customerModel.findOne({ _id: orders[0].user }); 
        console.log(userDetail);
        res.render('adminOrderdetails', {
          orders,
          userDetail,
        });
    
    } catch (err) {
      console.log(err);
    }
  };

exports.OrderDelete = async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({success:false,message:'It is not an Valid Id'});
             }
        const order = await OrderModel.findById(orderId);
        if(!order){
            return res.status(404).json({success:true,message:'Order Not found in Database'})
        }
        await OrderModel.findByIdAndDelete(orderId);

        res.sendStatus(200);
    }catch(err){
        console.log(err);
        res.status(500).send('Error deleting the order');
    }
}

exports.orderDetailedView = async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        console.log(orderId)
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({success:false,message:'It is not an Valid Id'});
             }
        const order = await OrderModel.findById(orderId);
        if(!order){
            return res.status(404).json({success:false,message:'Order Not found in Database'})
        }
        const orders = await OrderModel.findOne({_id:orderId}).sort({ createdAt: -1 }).populate('user', 'username').exec();
        const userId = orders.user;
        const userDetail = await customerModel.findOne({_id:userId})
        console.log(userDetail)
        res.render('adminOrderdetails', {
            pagetitle: '',
            orders,
            userDetail,
            message:""
        });

    }catch(err){
        console.log(err);
        res.status(500).send('Error deleting the order');
    }
}

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.orderStatus;
        if (newStatus === 'Canceled') {
            const canceledOrder = await OrderModel.findById(orderId);
            if (!canceledOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            for (const orderItem of canceledOrder.items) {
                const product = await Product.productModel.findById(orderItem.productId);

                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
        }
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: orderId },
            { status: newStatus },
            { new: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.returnOrder = async(req,res)=>{
    try{
        const orderId = req.params.orderId
        console.log(orderId);
        const order = await OrderModel.findById(orderId)
       order.status = 'Return'
       await order.save()
       res.status(200).json({success : true})
    }catch(error){
        console.log(error.message);
        res.status(500).json({success : false})
    }
}