const adminModel = require("../model/admin");
const CategoryModel = require("../model/category");
const {customerModel} = require("../model/customer");
const {productModel} = require("../model/product");
const bcrypt = require("bcrypt");
const {Coupon} = require('../model/coupenModel')
const { validationResult } = require('express-validator');
const Order = require('../model/OrderModel')
const PDFDocument = require('pdfkit');
// const pdfmake = require('pdfmake');
// const easyinvoice = require('easyinvoice');
// const fs = require('fs');
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;


let adminlogin = (req,res)=>{
    if(req.session.admin){
      res.redirect('/admin/dashboard')
    }else{
      res.render('admin-login',{err : ""})
    }
}


let adminloginpost = async (req,res)=>{
    try{
        const {
            adminEmail,
            adminPassword
          } = req.body;
         
          const adminExist = await adminModel.findOne({
            adminEmail: adminEmail
          
          })
          if (!adminExist) {
            return res.render('admin-login',{err:"Invalid username"})
          }
             
          if (adminExist) {
            
            const isPassWordValid = await bcrypt.compare(adminPassword , adminExist.adminPassword)
            console.log(isPassWordValid);
            if (isPassWordValid) {
              req.session.admin = adminEmail
               res.redirect('/admin/dashboard')
            } else {
              return res.render('admin-login',{err:"Incorrect password"})
            }
          }

    }catch(error){
        console.error("Error during login : " ,error);
        res.status(500).json({
            message:"Server error"
        })
    }
} 
const dashboard = async (req, res) => {
  try {
    const allProducts = await productModel.find();
    const allCategories = await CategoryModel.find();
    const allOrders = await Order.find();
    const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('user', 'username')
    .limit(4)
    .exec();
    const userDetail = await customerModel.findOne({ _id: orders[0].user });

    const productCount = allProducts.length;
    const categoriesCount = allCategories.length;
    const orderCount = allOrders.length;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const monthlyOrders = await Order.find({
      orderDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalRevenue = allOrders.reduce((total, order) => {
      return total + order.billTotal;
    }, 0);

    const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;

    const deliveredOrders = monthlyOrders.filter(order => order.status === 'Delivered');
    const pendingOrders = monthlyOrders.filter(order => order.status !== 'Delivered');

    const monthlyEarnings = deliveredOrders.reduce((totalEarnings, order) => {
      return totalEarnings + order.billTotal;
    }, 0);

    const weeklyOrders = await Order.find({
      orderDate: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const weeklyOrderCount = weeklyOrders.length;
    const deliveredOrderCount = deliveredOrders.length;
    const pendingOrderCount = pendingOrders.length;

    res.render('admin-dashboard', {
      productCount,
      categoriesCount,
      orderCount,
      weeklyOrderCount,
      deliveredOrderCount,
      pendingOrderCount,
      totalRevenue,
      averageRevenue,
      monthlyEarnings,
      orders,
      userDetail,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
};


let usermanagement = async (req, res) => {
    try {
      const ITEMS_PER_PAGE = 6; 
      let search = '';
      let page = 1;

      if (req.query.search) {
        search = req.query.search;
      }

      if (req.query.page && parseInt(req.query.page)) {
        page = parseInt(req.query.page);
      }

      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const totalItems = await customerModel.countDocuments({
        $or: [
          { username: { $regex: new RegExp(sanitizedSearch, 'i') } },
          { email: { $regex: new RegExp(sanitizedSearch, 'i') } },
          { phone: { $regex: new RegExp(sanitizedSearch, 'i') } },
        ],
      });

      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      const skip = (page - 1) * ITEMS_PER_PAGE;

      const userdetails = await customerModel
        .find({
          $or: [
            { username: { $regex: new RegExp(sanitizedSearch, 'i') } },
            { email: { $regex: new RegExp(sanitizedSearch, 'i') } },
            { phone: { $regex: new RegExp(sanitizedSearch, 'i') } },
          ],
        })
        .skip(skip)
        .limit(ITEMS_PER_PAGE);

      res.render('user-management', {
        userdetails,
        currentPage: page,
        totalPages,
        search,
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).send('Internal Server Error');
    }
};



let products = async (req,res)=>{
      const products = await productModel.find();
      res.render("products", {
        products,
        category
      });
};

let productpost = async (req,res)=>{
    try{
       const {
        image,
        productName,
        price,
        countInStock,
        category,
        description
       } = req.body;
       const newProduct = new productModel({
        image,
        productName,
        price,
        countInStock,
        category,
        description
       });

       await newProduct.save();
       res.redirect('/admin/products')
    }catch(error){
        res.status(500).json({
            error : "Internal server error",
        });
    }
}

let userblock = async(req,res)=>{
    let { id } = req.body;
    let userData = await customerModel.findById(id);
    if(userData){
        if(userData.isBlocked === true) {
            userData.isBlocked = false;
            userData.save();
            res.status(200).json({
              status: true
            });
        }else if (userData.isBlocked === false) {
            userData.isBlocked = true;
            userData.save();
            res.status(201).json({
              status: true
            });
    }
}else{
    res.status(402).json({
        status: true
      });
}
};
let productManagementEdit = async (req, res) => {
    try {
      const productId = req.params.Id;
      const existingProduct = await productModel.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({
          error: ' Product not found'
        });
      }
      const {
        productName,
        price,
        countInStock,
        category,
        description,
      } = req.body;
  
      let image = existingProduct.image;
      let images = existingProduct.images;
  
      if (req.files) {
        if (req.files['image']) {
          image = req.files['image'][0].path.replace(/\\/g, '/').replace('public/', '');
        }

        if (req.files['images']) {
          images = req.files['images'].map((file) =>
            file.path.replace(/\\/g, '/').replace('public/', '')
          );
        }
      }
      const updatedProduct = await productModel.findByIdAndUpdate(
        productId, {
          productName,
          description,
          countInStock,
          category,
          price,
          image,
          images,
        }, {
          new: true,
        }
      );
      
      if (!updatedProduct) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }
  
      res.status(200).redirect('/admin/product-management');
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Internal Server Error',
        errorMessage: error.message
      });
    }
  };

let categories = (req,res)=>{
    res.render('categories')
}



const adminLogout =  (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
  res.render('admin-login',{err : "Logout Successfully"})
  });
}
 

const couponGet = async (req, res) => {
  try {
    let search = ''
    const page = parseInt(req.query.page) || 1;
    const pageSize = 5;

    const totalCoupons = await Coupon.countDocuments();
    const totalPages = Math.ceil(totalCoupons / pageSize);

    const coupons = await Coupon.find()
      .sort({ validity: 1 }) 
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .exec();

    res.render('Coupon', { coupons, totalPages, currentPage: page , search });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send('Internal Server Error');
  }
};

const couponPost = async (req, res) => {
  try {
    const {
      couponCode,
      validity,
      minPurchase,
      minDiscountPercentage,
      discription,
    } = req.body;
    console.log(req.body);
    let status = 'Active'
    const newCoupon = new Coupon({
      couponCode,
      validity,
      minPurchase,
      minDiscountPercentage,
      discription,
      status
    });

    const savedCoupon = await newCoupon.save();

    res.status(201).json(savedCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
const couponDelete = async (req,res)=>{
  try{
     const {couponId} = req.params;
     console.log(couponId);
  const coupon = await Coupon.findById(couponId)
  console.log(coupon);
  if(!coupon){
    return res.status(404).render('page-not-found');
  }
  coupon.status = 'Cancel'
  await coupon.save()
  res.status(200).json({ message: 'coupon canceled successfully' });
  }catch(error){
    console.log(error.message);
  }
}
// const saleReport = async (req, res) => {
//   try {
//     const allProducts = await productModel.find();
//     const allCategories = await CategoryModel.find();
//     const allOrders = await Order.find();

//     const productCount = allProducts.length;
//     const categoriesCount = allCategories.length;
//     const orderCount = allOrders.length;
//     const currentDate = new Date();
//     const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//     const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
//     const startOfWeek = new Date(currentDate);
//     startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
//     const endOfWeek = new Date(currentDate);
//     endOfWeek.setDate(startOfWeek.getDate() + 6); 

//     const monthlyOrders = await Order.find({
//       orderDate: { $gte: startOfMonth, $lte: endOfMonth },
//     });

//     const totalRevenue = allOrders.reduce((total, order) => {
//       return total + order.billTotal;
//     }, 0);

//     const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;

//     const deliveredOrders = monthlyOrders.filter(order => order.status === 'Delivered');
//     const pendingOrders = monthlyOrders.filter(order => order.status !== 'Delivered');

//     const monthlyEarnings = deliveredOrders.reduce((totalEarnings, order) => {
//       return totalEarnings + order.billTotal;
//     }, 0);

//     const weeklyOrders = await Order.find({
//       orderDate: { $gte: startOfWeek, $lte: endOfWeek },
//     });

//     const weeklyOrderCount = weeklyOrders.length;
//     const deliveredOrderCount = deliveredOrders.length;
//     const pendingOrderCount = pendingOrders.length;

//     const doc = new PDFDocument();

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="sales_report.pdf"`);

//     doc.pipe(res);

//     doc
//       .font('Helvetica-Bold')
//       .fontSize(20)
//       .text('LACE MIST', { align: 'center' })
//       .fontSize(12)
//       .moveDown(1);

//     doc
//       .font('Helvetica')
//       .fontSize(14)
//       .text('Sales Report', { align: 'center' })
//       .fontSize(12)
//       .moveDown(1);

//     doc.text(`Total Products: ${productCount}`);
//     doc.text(`Total Categories: ${categoriesCount}`);
//     doc.text(`Total Orders: ${orderCount}`);
//     doc.text(`Total Revenue: INR${totalRevenue.toFixed(2)}`);
//     doc.text(`Average Revenue Order: INR${averageRevenue.toFixed(2)}`);
//     doc.text(`Monthly Earnings: INR${monthlyEarnings.toFixed(2)}`);
//     doc.text(`Weekly Order Count: ${weeklyOrderCount}`);
//     doc.text(`Delivered Order Count: ${deliveredOrderCount}`);
//     doc.text(`Pending Order Count: ${pendingOrderCount}`);
    
//     doc.moveDown(1);
//     doc.moveDown(1);
//     doc
//       .font('Helvetica-Oblique')
//       .fontSize(10)
//       .text('Thank you for your business!', { align: 'center' });

//     doc.end();
//   } catch (error) {
//     console.error('Error generating sales report:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };
const saleReport = async (req, res) => {
  try {
    let salesData = null; 
        const allProducts = await productModel.find();
    const allCategories = await CategoryModel.find();
    const allOrders = await Order.find();

    const productCount = allProducts.length;
    const categoriesCount = allCategories.length;
    const orderCount = allOrders.length;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 

    const monthlyOrders = await Order.find({
      orderDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalRevenue = allOrders.reduce((total, order) => {
      return total + order.billTotal;
    }, 0);

    const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;

    const deliveredOrders = monthlyOrders.filter(order => order.status === 'Delivered');
    const pendingOrders = monthlyOrders.filter(order => order.status !== 'Delivered');

    const monthlyEarnings = deliveredOrders.reduce((totalEarnings, order) => {
      return totalEarnings + order.billTotal;
    }, 0);

    const weeklyOrders = await Order.find({
      orderDate: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const weeklyOrderCount = weeklyOrders.length;
    const deliveredOrderCount = deliveredOrders.length;
    const pendingOrderCount = pendingOrders.length;


    let docDefinition = {
      content: [
        { text: `Sales Report
        
        `, style: 'header' }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        }
      }
    };
      docDefinition.content.push(
        `Total Revenue: INR ${totalRevenue.toFixed(2)}
        `,
        `Total Order Count: ${orderCount}
        `,
       ` Total Count In Stock: ${productCount}
       `,
        `Average Sales: ${averageRevenue ?averageRevenue.toFixed(2) : 'N/A'}
        `,
        `Average Revenue: ${averageRevenue ? averageRevenue.toFixed(2) : 'N/A'}
        `
      );

      let orders =  await Order.find();

      if (orders && orders.length > 0) {
        // Adding order details to PDF
        let rows = orders.map(order => [
          `#${order._id.toString()}`,
          order.status,
          order.orderDate.toLocaleString(),
          order.paymentMethod,
          `INR ${order.billTotal}`
        ]);

        docDefinition.content.push({
          style: 'tableExample',
          table: {
            headerRows: 1,
            body: [
              ['OrderID', 'Status', 'Date', 'Payment Method', 'Total'],
              ...rows
            ]
          }
        });
      } else {
        docDefinition.content.push('No order details available.');
      }

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => {
      res.writeHead(200, 
      {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;filename="filename.pdf"'
      });
      res.end(buffer);
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).send('Internal Server Error');
  }
};


const saleDailyReport = async (req, res) => {
  try {
    const allProducts = await productModel.find();
    const allCategories = await CategoryModel.find();
    const allOrders = await Order.find();

    const productCount = allProducts.length;
    const categoriesCount = allCategories.length;
    const orderCount = allOrders.length;

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 

    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

    const dailyOrders = await Order.find({
      orderDate: { $gte: startOfDay, $lte: endOfDay },
    });
    const dailyOrderCount = dailyOrders.length;
    const totalRevenue = allOrders.reduce((total, order) => {
      return total + order.billTotal;
    }, 0);

    const averageRevenue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const dailyEarnings = dailyOrders.reduce((totalEarnings, order) => {
      return totalEarnings + order.billTotal;
    }, 0);

    const deliveredOrderCount = dailyOrders.filter(order => order.status === 'Delivered').length;
    const pendingOrderCount = dailyOrders.filter(order => order.status !== 'Delivered').length;
    
    let docDefinition = {
      content: [
        { text: `Daily Report
        
        `, style: 'header' }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        }
      }
    };
      docDefinition.content.push(
        `Total Revenue: INR ${totalRevenue.toFixed(2)}
        `,
        `Total Order Count: ${orderCount}
        `,
        `Daily Order Count: ${dailyOrderCount}
        `,
       ` Total Count In Stock: ${productCount}
       `,
        `Earnings: ${dailyEarnings ? dailyEarnings.toFixed(2) : 'N/A'}
        `,
        `Average Revenue: ${averageRevenue ? averageRevenue.toFixed(2) : 'N/A'}
        `
      );

    

      if (dailyOrders && dailyOrders.length > 0) {
        // Adding order details to PDF
        let rows = dailyOrders.map(order => [
          `#${dailyOrders._id.toString()}`,
          dailyOrders.status,
          dailyOrders.orderDate.toLocaleString(),
          dailyOrders.paymentMethod,
          `INR ${dailyOrders.billTotal}`
        ]);

        docDefinition.content.push({
          style: 'tableExample',
          table: {
            headerRows: 1,
            body: [
              ['OrderID', 'Status', 'Date', 'Payment Method', 'Total'],
              ...rows
            ]
          }
        });
      } else {
        docDefinition.content.push('No order details available.');
      }

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => {
      res.writeHead(200, 
      {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;filename="filename.pdf"'
      });
      res.end(buffer);
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
    dashboard,
    adminlogin,
    adminloginpost,
    products,
    productpost,
    productManagementEdit,
    usermanagement,
    userblock,
    categories,
    adminLogout,
    couponGet,
    couponPost,
    couponDelete,
    saleReport,
    saleDailyReport
  };
  

