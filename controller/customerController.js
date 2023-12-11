const {customerModel} = require("../model/customer");
const categoryModel = require("../model/category");
const {productModel} = require("../model/product");
const bcrypt = require("bcrypt");
const {sentOtp} = require("../nodeMailer");
const {  error,log } = require("console");
const { AddressModel } = require('../model/addressModel');
const orderModel = require('../model/OrderModel')
const Razorpay = require('razorpay');
const dotenv = require('dotenv').config();
const {walletModel} = require('../model/walletModel');
const { whislistModel } = require("../model/WhislistModel");
const { Model } = require("mongoose");
const {transactionModel} = require('../model/transactionModel')
const shortid = require('shortid');
const { totalmem } = require("os");
const PDFDocument = require('pdfkit');
const easyinvoice = require('easyinvoice');
const fs = require('fs')
const {Readable}  = require('stream')
const ejs = require('ejs');
const path = require('path')
const puppeteer = require('puppeteer')

function generateReferralCode() {
  return shortid.generate();
}

function otpNull(req, res) {
  if (req.session.otp != null) {
    setTimeout(() => {
      log('Otp is expired')
      req.session.otp = null;
    }, 1000 * 60 * 1);
  }
}

let resendOtp = async (req, res, next) => {
  try {
    if (req.session.userDetails) {
      req.session.otp = await sentOtp(req.session.userDetails.email)
      otpNull(req, res, next)
      res.status(200).json({
        status: true
      })
    } else {
      res.status(201).json({
        status: true
      })
    }
  } catch (e) {
    console.error(e);
    res.status(500)
    next()
  }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

let home = async (req, res,next) => {
  try {
    let search = ''
    let query = {}
    let sortOption = "";

    if(req.query.search){
      search = req.query.search
  }
  if (req.query.sort) {
    sortOption = req.query.sort;
}
let sortOptions = {};
if (sortOption === 'priceLowToHigh') {
  sortOptions = { price: 1 };
} else if (sortOption === 'priceHighToLow') {
  sortOptions = { price: -1 };
}
    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let Productitems = await productModel.find({
      $or : [
        {productName: { $regex: new RegExp(sanitizedSearch, 'i') }},
      {brand: { $regex: new RegExp(sanitizedSearch, 'i') }},
  ],
    }).limit(4)
    .sort({ createdAt: -1 , ...sortOptions });
    
    const selectedCategory = req.query.category || ''; 
    if (selectedCategory) {
        query.category = selectedCategory;
    }
    let products = await productModel.find({
      $or: [
          { productName: { $regex: new RegExp(sanitizedSearch, 'i') } },
          { brand: { $regex: new RegExp(sanitizedSearch, 'i') } },
      ],
      ...query, 
  }).sort({ createdAt: -1 , ...sortOptions });
    

    const categories = await categoryModel.find().lean();
    if (req.session.user) { 
      let userData = await customerModel.findOne({
        email: req.session.user
      })
      if (!userData.isBlocked) {
        res.render("home", {
          products,
          Productitems,
          userEmail: userData.email,
          categories,
          selectedCategory
        });
      } else {
        req.session.isBlocked = true;
        res.redirect('/login');
      }
    } else {
      res.render("home", {
        products,
        Productitems,
        userEmail: null,
        categories,
        selectedCategory
      })
    }
  } catch (error) {
    console.error(error.message);
    res.status(500)
    next()

  }
};

const loginPage = async (req, res,next) => {
  try {
    if (req.session.isBlocked) {
      req.session.user = false;
      req.session.isBlocked = false;
      res.render("user-login", {
        err: "Sorry user blocked"
      })
    } else if (req.session.passwordIncorrect) {
      req.session.passwordIncorrect = false;
      res.render('user-login', {
        err: 'Incorrect Password'
      });
    } else if (req.session.user) {
      res.redirect('/');
    } else if (req.session.noUser) {
      req.session.noUser = false;
      res.render('user-login', {
        err: "Incorrect Username"
      });
    } else {
      res.render("user-login", {
        err: ""
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500)
    next()
  }
};

const loginpost = async (req, res,next) => {
  try {
    const userData = await customerModel.findOne({
      email: req.body.email,
    });
    console.log(userData);
    const data = req.body;

    if (userData) {
      const isPasswordValid = await bcrypt.compare(
        data.password,
        userData.password
      );
      console.log(isPasswordValid);
      if (isPasswordValid) {
        if (userData.isBlocked) {
          req.session.isBlocked = true;
          res.redirect('/login')
        } else {
          req.session.email = userData.email;
          req.session.user = userData.email
          req.session.userId = userData._id
          console.log(userData.email, data.email);
          if(req.session.referal){  
            const wallet = await walletModel.findOneAndUpdate(
              { user: userData._id },
              { $inc: { balance: 500 } },
              { new: true, upsert: true }
            );
            const transaction = await transactionModel.findOneAndUpdate(
              { user: userData._id },
              {
                  $set: {
                      amount: 500, 
                      type: 'credit',
                  },
              },
              { new: true, upsert: true }
          );
            
            console.log('/////////');
          }
          req.session.referral = null;
          res.redirect('/')
        }
      } else {
        console.log("Password not match");
        req.session.passwordIncorrect = true;
        res.redirect('/login');
      }
    } else {
      console.log("User not found");
      req.session.noUser = true;
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error during login" + error);
    res.status(500)
    next()
  }
}

const postRegister = async (req, res, next) => {
  try {
    let {
      email,
      password,
      phone,
      username,
      referal
    } = req.body;
    let userData = await customerModel.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });
    const user = await customerModel.findOne({referalCode: referal})
    if(user){
      req.session.referal = referal
    }
    if (userData) {
      return res.redirect('/register');
    } else {
      let passwordhashed = await securePassword(password);
      let user = {
        email: email,
        password: passwordhashed,
        username: username,
        phone: phone,
        referalCode : generateReferralCode(),
      };
      req.session.userDetails = user;
      req.session.otp = await sentOtp(email);
      otpNull(req, res, next);
      res.redirect('/otp');
    }
  } catch (error) {
    console.log(error);
    res.redirect('/register');
  }
};

let loadOTP = async (req, res,next) => {
  try {
    if (req.session.otpExpired) {
      req.session.otpExpired = false;
      res.render("otp", {
        err: "Otp expired"
      })
    } else if (req.session.otpFalse) {
      req.session.otpFalse = false;
      res.render("otp", {
        err: "Incorrect Otp"
      })
    } else {
      res.render("otp", {
        err: "",
       
      })
    }
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  }
};


let postVerifyOtp = async (req, res) => {
  let {
    otp
  } = req.body;
  console.log(otp, req.session.userDetails);
  try {
    if (req.session.otp != null) {
      if (!isNaN(otp)) {
        if (otp === req.session.otp) {
          let response = await customerModel.insertMany([req.session.userDetails])
          req.session.userId = false
          
          res.redirect('/login')
        } else {
          req.session.otpFalse = true;
          res.redirect("/otp");
        }
      }
    } else {
      req.session.otpExpired = true;
      res.redirect("/otp")
    }
  } catch (error) {
    console.error(error);
    res.redirect("/signup")
  }
};


let signuppage = (req, res) => {
  let referralCode;
  if(req.query.referral){
  referralCode = req.query.referral;
  }else{
  referralCode = null
  }
  res.render('user-signup', {
    err: "",
    referralCode : referralCode,
    
  });
};

const productDetails = async (req, res,next) => {
  try {
    const itemsPerPage = 4;
    let search = '';
    let query = {};
    let sortOption = '';

    if (req.query.search) {
      search = req.query.search;
    }

    if (req.query.sort) {
      sortOption = req.query.sort;
    }

    let sortOptions = {}; 

    if (sortOption === 'priceLowToHigh') {
      sortOptions = { price: 1 };
    } else if (sortOption === 'priceHighToLow') {
      sortOptions = { price: -1 };
    }

    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const product_id = req.query.id;
    const categories = await categoryModel.find();

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * itemsPerPage;
    let newProduct = await productModel.find({$or: [
            { productName: { $regex: new RegExp(sanitizedSearch, 'i') } },
            { brand: { $regex: new RegExp(sanitizedSearch, 'i') } },
        ],
        ...query,}).sort(sortOptions);
    const products = await productModel
      .find({
        $or: [
          { productName: { $regex: new RegExp(sanitizedSearch, 'i') } },
          { brand: { $regex: new RegExp(sanitizedSearch, 'i') } },
        ],
        ...query,
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(itemsPerPage);

    const totalProducts = await productModel.countDocuments({
      $or: [
        { productName: { $regex: new RegExp(sanitizedSearch, 'i') } },
        { brand: { $regex: new RegExp(sanitizedSearch, 'i') } },
      ],
      ...query,
    });

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    res.render('frontend-products', {
      products,
      categories,
      newProduct,
      currentPage: page,
      totalPages,
      itemsPerPage,
      search,
      sortOption,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  }
};


const shoes = async (req, res) => {
  try {
    const product_id = req.query.id
    const categories = await categoryModel.find({})
    let products = await productModel.find({})
    let newProduct = await productModel.find({})
    console.log(products)
    if (products)
      res.render('shoes', {
        products,
        categories,
        newProduct
      })
    else
      res.send("Not Availabele")
  } catch (error) {
    console.log(error.message)
  }
}


const productDetailedView = async (req, res,next) => {
  try {
    const id = req.params.productId;

    const product = await productModel.findById(id);

    if (!product) {
      res.status(404);
      next()
    }

    let user = (req.session.email) ? await customerModel.findOne({
      email: req.session.email
    }) : null;

    res.render('ProductDetailedView', {
      product,
      userId: (user != null) ? user._id : false
    });
  } catch (error) {
    console.error(error.message);
    res.status(500)
    next()
  }
};

const userProfileGet = async (req, res,next) => {
  try {
    const userDetails = await customerModel.findOne({
      _id: req.session.userId
    });
    const product = await productModel.findOne({
      _id: req.session.userId
    });
    const category = await categoryModel.find({
      status: 'active'
    });
    const address = await AddressModel.findOne({
      user: (req.session.userId)
    })
    const Wallet = await walletModel.findOne({
      user: (req.session.userId)
    })
   
    let orders = await orderModel.find({ user: req.session.userId }).populate('items.productId').sort({createdAt:-1});
    orders = orders || []; 
    if (userDetails) {
      function getStatusColorClass(status) {
        if (status === "Canceled") {
            return "status-red";
        } else if (status === "Delivered") {
            return "status-blue";
        } else if (status === "Pending") {
            return "status-orange";
        } else {
            return "status-green"; 
        }
    }
      res.status(200).render('UserProfile', {
        userDetails,
        category,
        address ,
        orders : orders,
        product,
        message : "",
        Wallet,
        getStatusColorClass
      });
    } else {
      res.status(404).render('user-login',{err : "Please login again" });
    }
  } catch (error) {
    console.error(error);
    res.status(500)
    next()
  }
}

const userLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
}

const userAddAddress = async (req, res,next) => {
  try {
  console.log("dhsuibjihvdfvhdiuhfiuhduifhuidhfuihduifhuidshuihdsuihsfd");
    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country
    } = req.body;

    const userId = req.session.userId; 
    console.log(userId);
    const user = await customerModel.findById(userId);
    if (!user) {
      res.status(404)
      next()
    }
    let useraddresses = await AddressModel.findOne({
      user : userId
    });
  console.log(useraddresses);
    if (!useraddresses) {
      useraddresses = new AddressModel({
        user: userId,
        addresses: []
      });
    }
    const existingAddress = useraddresses.addresses.find((address) =>
      address.addressType === addressType &&
      address.HouseNo === houseNo &&
      address.Street === street &&
      address.pincode === pincode &&
      address.city === city &&
      address.State === state &&
      address.Country === country
    );

    if (existingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address already exists for this user'
      });
    }

    if (useraddresses.addresses.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'User cannot have more than 3 addresses',
      });
    }
    const newAddress = {
      addressType: addressType,
      HouseNo: houseNo,
      Street: street,
      Landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      State: state,
      Country: country,
    };
    useraddresses.addresses.push(newAddress);
    await useraddresses.save();
    res.status(200).json({
      success: true,
      message: 'Address added successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors
      });
    } else {
      console.log(err.message);
      res.status(500)
      next()
    }
  }
};

const userRemoveaddress = async (req, res,next) => {
  try {
    console.log("khvh")
    const userId = req.session.userId;
    
    const addressTypeDelete = req.query.addressType;
    const address = await AddressModel.findOne({ user:userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Addresses not found' });
    }
    const addressIndex = address.addresses.findIndex((address) => address.addressType === addressTypeDelete);

    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: `Address with type '${addressTypeDelete}' not found` });
    }
    address.addresses.splice(addressIndex, 1);
    await address.save();
    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500)
    next()
  }
};

const EditProfile = async (req, res ,next) => {
  try {
  const { Name, Email, Phone } = req.body;
  const userId = req.session.userId;
    const UpdateUser =   await customerModel.findByIdAndUpdate(userId, {
          username: Name,
          email:Email,
          phone: Phone,
      });
      if (req.file) {
        const newImage = req.file.path.replace(/\\/g, '/').replace('public/', '');
        UpdateUser.image = newImage;
    }
      await UpdateUser.save()
      return res.redirect('/profile');
  } catch (error) {
      console.error(error.message);
      res.status(500)
      next()
  }
}
const editAddress = async (req, res ,next) => {
  try {
    const userId = req.session.userId;
    const {
      addressType,
      HouseNoland,
      Street,
      Landmark,
      pincode,
      city,
      district,
      State,
      Country,
    } = req.body;
    const userAddress = await AddressModel.findOne({ user: userId });
    const existingAddress = userAddress.addresses.find(
      (address) => address.addressType === addressType
    );
    if (existingAddress) {
      existingAddress.HouseNo = HouseNoland;
      existingAddress.Street = Street;
      existingAddress.Landmark = Landmark;
      existingAddress.pincode = pincode;
      existingAddress.city = city;
      existingAddress.district = district;
      existingAddress.State = State;
      existingAddress.Country = Country;
    } else {
      const newAddress = {
        addressType,
        HouseNo: HouseNoland,
        Street,
        Landmark,
        pincode,
        city,
        district,
        State,
        Country,
      };
      userAddress.addresses.push(newAddress);
    }
    await userAddress.save();
    res.redirect('/checkout');
  } catch (error) {
    console.error(error);
    res.status(500)
    next()
  }
};
const cancelOrder = async (req, res,next) => {
  try {
      const { orderId } = req.params; 
      console.log(orderId);
      const order = await orderModel.findById(orderId);
      console.log(order);
      const canceledproducts = order.items
      if (!order) {
          return res.status(404).render('page-not-found');
      }
      if(order.paymentMethod == 'Razorpay'){
        let refundAmount = 0;
        let quantityIncrement = 0 ;
        for(const product of canceledproducts){
          refundAmount += product.price * product.quantity;
          quantityIncrement = product.quantity

          const updateQuantity = await productModel.findByIdAndUpdate(
            { _id: product.productId },
            { $inc: { countInStock: quantityIncrement } },
            { new: true }
          );
        }
        console.log(req.session.userId + "////////////////////dsgryhdffkjhdfgbkjkdbgjbgfvjbjfbgvjkdbjkjknbjkfdnjkbngfjkbfjkb")
        const walletGet = await walletModel.findOneAndUpdate(
          { user: req.session.userId },
          { $inc: { balance: refundAmount } }, 
          { upsert: true, new: true }
        );
        const newTransaction = new transactionModel({
          user : req.session.userId,
          wallet: walletGet._id,
          amount: refundAmount,
          type: 'credit', 
      });
      await newTransaction.save();
        order.status = 'Canceled';
        await walletGet.save() 
        await order.save();
        res.status(200).json({ message: 'Order canceled successfully' });
      }else if(order.paymentMethod == 'Wallet'){
        let refundAmount = 0;
        let quantityIncrement = 0 ;
        for(const product of canceledproducts){
          refundAmount += product.price * product.quantity;
          quantityIncrement = product.quantity

          const updateQuantity = await productModel.findByIdAndUpdate(
            { _id: product.productId },
            { $inc: { countInStock: quantityIncrement } },
            { new: true }
          );
        }
        console.log(req.session.userId + "////////////////////dsgryhdffkjhdfgbkjkdbgjbgfvjbjfbgvjkdbjkjknbjkfdnjkbngfjkbfjkb")
        const walletGet = await walletModel.findOneAndUpdate(
          { user: req.session.userId },
          { $inc: { balance: refundAmount } }, 
          { upsert: true, new: true }
        );
        const newTransaction = new transactionModel({
          user : req.session.userId,
          wallet: walletGet._id,
          amount: refundAmount,
          type: 'credit', 
      });
      await newTransaction.save();
        order.status = 'Canceled';
        await walletGet.save() 
        await order.save();
        res.status(200).json({ message: 'Order canceled successfully' });
      }
      else{
      // Update the order status to "canceled"
      for(const product of canceledproducts){
        quantityIncrement = product.quantity
        const updateQuantity = await productModel.findByIdAndUpdate(
          { _id: product.productId },
          { $inc: { countInStock: quantityIncrement } },
          { new: true }
        );
      }
      order.status = 'Canceled';
      await order.save();

      res.status(200).json({ message: 'Order canceled successfully' });
      }
  } catch (error) {
      console.log(error.message+"erroreerrr");
      res.status(500)
      next()
  }
};
const returnOrder = async (req, res ,next) => {
  try {
      const { orderId } = req.params;
      const reason = req.body.ReasonValue
      console.log(reason); 
      console.log(orderId);
      const order = await orderModel.findById(orderId);
      console.log(order);
     
      const canceledproducts = order.items
      if (!order) {
          return res.status(404).render('page-not-found');
      }
      order.status = 'Request'
      await order.save()
      res.status(200).json({success : true})
    
  } catch (error) {
      console.log(error.message+"erroreerrr");
      res.status(500)
      next()
  }
};

const CustumorOrder = async(req,res ,next)=>{
  try{
    if(!req.session.userId){
      res.redirect('/login')
    }
    let orders = await orderModel.find({ user: req.session.userId }).populate('items.productId').sort({createdAt : -1}).exec();
  
    console.log(orders);
    res.render('CustomerOrders',{orders});

  }catch(error){
    log(error.message);
    res.status(500)
    next()
  }
}

const whislistRemove = async (req, res,next) => {
  try {
    const userId = req.session.userId;
    const product = req.params.product;
    const whislist = await whislistModel.findOne({ user: userId });
console.log("hdffffffffffffffffffffffffffffffffffff");
    if (!whislist) {
      res.status(404)
      next()
    }

    const productIndex = whislist.items.findIndex((item) => item.product.toString() === product.toString());
     console.log(productIndex);
    if (productIndex !== -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in the wishlist',
      });
    }

    whislist.items.splice(productIndex , 1);

    await whislist.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from the wishlist',
    });
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  } 
};
const orderView = async (req, res,next) => {
  try {
    const orderId = req.params.orderId;
    console.log('Received Order ID:', orderId); 

    const orders = await orderModel.findOne({ _id: orderId }).populate('items.productId');

    if (!orders) {
      console.log(`Order not found for ID: ${orderId}`);
      return res.status(404).render('error', { message: 'Order not found' });
    }

    console.log('Order:', orders); // Log order details
    res.render('OrderView', { orders });
  } catch (error) {
    console.error(error.message); 
    res.status(500)
    next()
  }
};

const walletTransactions = async (req, res,next) => {
  try {
    const Items_page = 4;
    let search = '';
    let page = 1;

    if (req.query.page && parseInt(req.query.page)) {
      page = parseInt(req.query.page);
    }

    const startDate = new Date('2023-11-28T14:54:01.872+00:00');  
    const endDate = new Date();    
    
    const totalItems = await transactionModel.countDocuments({
      date: { $gte: startDate, $lt: endDate }
    });
    const totalPages = Math.ceil(totalItems / Items_page);
    const skip = (page - 1) * Items_page;
    const userId = req.session.userId;

    const transactions = await transactionModel
      .find({ user: userId })
      .populate('wallet')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Items_page);

    const Wallet = await walletModel.findOne({ user: userId });
    const user = await customerModel.findOne({ _id: userId });

    console.log(user);

    res.render('wallet', { transactions, Wallet, user, currentPage: page, totalPages, search  });

  } catch (error) {
    console.error('Error in walletTransactions:', error.message);
    res.status(500)
    next()
  }
};

const referal = async(req,res,next)=>{
  try{
    const user = await customerModel.findOne({_id : req.session.userId})
    console.log(user);
    res.render('referalPage',{user})
  }catch(error){
    console.log(error.message);
    res.status(500)
    next()
  }
}


const Invoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const user = await customerModel.findOne({
      _id: req.session.userId
    });
    const order = await orderModel.findOne({ _id: orderId }).populate('items.productId');
    var products = [];
    order.items.forEach((item) => {
      products.push({
        description: item.name,
        quantity: item.quantity,
        "tax-rate":0,
         price: item.productPrice,
      });
    });

    var data = {
      customize: {},
      images: {
        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },

      sender: {
        company: "LACE MIST",
        address: "KOCHI",
        zip: "686633",
        city: "maradu",
        country: "india",
      },

      client: {
        company: user.username,
        address: "KOCHI",
        zip: "686633",
        city: "maradu",
        country: "india",
      },

      information: {
        orderId: orderId,
        date: order.createdAt.toLocaleString(),
        "due-date": "Nil",
      },
      products: products,// Format billTotal to 2 decimal places
      "bottom-notice": "Thank you, Keep shopping.",
    };

    easyinvoice.createInvoice(data, async function (result) {
      // The response will contain a base64 encoded PDF file
      await fs.writeFileSync("invoice.pdf", result.pdf, "base64");

      // Set the response headers for downloading the file
      res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
      res.setHeader("Content-Type", "application/pdf");

      // Create a readable stream from the PDF base64 string
      const pdfStream = new Readable();
      pdfStream.push(Buffer.from(result.pdf, "base64"));
      pdfStream.push(null);

      // Pipe the stream to the response
      pdfStream.pipe(res);
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500);
    next();
  }
};


const Referalparam = async(req,res)=>{
  let referralCode;
  if(req.query.referral){
  referralCode = req.query.referral;
  }else{
  referralCode = null
  }
res.render('user-signup', {
    err: "User already exist",
    referralCode : referralCode
  })
}

module.exports = {
  productDetailedView,
  productDetails,
  home,
  loginPage,
  loginpost,
  loadOTP,
  postRegister,
  postVerifyOtp,
  signuppage,
  userLogout,
  securePassword,
  shoes,
  resendOtp,
  userProfileGet,
  userAddAddress,
  userRemoveaddress,
  EditProfile,
  editAddress,
  cancelOrder,
  CustumorOrder,
  whislistRemove,
  returnOrder,
  orderView,
  walletTransactions,
  referal,
  Invoice,
  Referalparam
}

