const {
  default: mongoose
} = require('mongoose');
const {
  cartModel
} = require('../model/cart');
const CategoryModel = require('../model/category');
const {
  customerModel
} = require('../model/customer');
const {
  productModel
} = require('../model/product');
const {
  AddressModel
} = require('../model/addressModel');
const OrderModel = require('../model/OrderModel');
const {
  whislistModel
} = require('../model/WhislistModel')
const {
  loginPage
} = require('./customerController');
const {
  Coupon
} = require('../model/coupenModel');
const Razorpay = require('razorpay')
const dotenv = require('dotenv').config();
const crypto = require('crypto');
const {
  log
} = require('console');
const { walletModel } = require('../model/walletModel');
const { transactionModel } = require('../model/transactionModel');

const addtoCart = async (req, res , next) => {
  try {
    console.log(req.body.userId, req.body.productId);
    if (req.body.userId != false) {
      let {
        productId,
        userId
      } = req.body;

      console.log(req.body);
      console.log("if worked");

      const product = await productModel.findById(productId);
      console.log(product);
      if (!product) {
        res.status(500)
        next()
      }
      if (product.quantity == 0) {
        res.status(404)
        next()
      }
      console.log(userId, "==================================");
      const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);

      if (!isValidObjectId) {
        console.log("user is not logged");
        res.status(500)
        next()
      }
      const userData = await customerModel.findById(userId);
      console.log(userData);
      if (!userData) {
        res.status(500)
        next()
      }
      const cart = await cartModel.findOne({
        userId: userId
      }); 
      if (!cart) {

        await cartModel.insertMany([{
          userId: userId,
          items: [{
            product: new mongoose.Types.ObjectId(productId),
            name:product.productName,
            image:product.image,
            quantity: 1,
            productPrice:product.price,
            price: product.price
          }],
          billTotal:product.price
        }])

        res.status(200).json({
          success: true,
          message: "Item added to cart"
        });

      } else {

        const cartItem = cart.items.find(item => item.product.equals(productId));

        if (cartItem) {
          cartItem.productPrice = product.price;
          cartItem.quantity += 1;
          cartItem.price = cartItem.quantity * product.price;
        } else {
          cart.items.push({
            product: productId,
            name:product.productName,
            image:product.image,
            productPrice: product.price,
            quantity: 1,
            price: product.price
          });
        }
        cart.billTotal = cart.items.reduce((total, item) => total + item.price, 0)
        await cart.save();

        res.status(200).json({
          success: true,
          message: "Item added to cart"
        })
      }
    } else {
      console.log("else worked");
    }

  } catch (error) {
    console.error(error);
    res.status(500)
    next()
  }
};
  const whishlistAddtoCart = async (req, res , next) => {
    try {
      console.log('mssaaaaaaaaaaaaaaaaaaaaaaaaaa');
      console.log(req.body.userId, req.body.productId);
      if (req.body.userId != false) {
        let {
          userId,
          productId,
        } = req.body;
        console.log("if worked");

        const product = await productModel.findById(productId);

        console.log(product);
        if (!product) {
          return res.status(404).render('page-not-found');
        }
        if (product.quantity == 0) {
          res.status(500)
          next()
        }
        const userData = await customerModel.findById(userId);
        console.log(userData);
        if (!userData) {
          res.status(500)
          next()
        }

        const cart = await cartModel.findOne({
          userId: userId
        });
        if (!cart) {
          await cartModel.insertMany([
            {
              userId: userId,
              items: [{
                product: new mongoose.Types.ObjectId(productId),
                quantity: 1,
                productPrice: product.price,
                price: product.price,
                name: product.productName,
                image: product.image,
              }],
              billTotal: product.price
            } 
          ]) 
          await whislistModel.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } }
          );
          res.status(200).json({
            success: true,
            message: "Item added to cart"
          });
        } else {
          const cartItem = cart.items.find(item => item.product.equals(productId));

          if (cartItem) {
            cartItem.productPrice = product.price;
            cartItem.quantity += 1;
            cartItem.price = cartItem.quantity * product.price;
          } else {
            cart.items.push({
              product: productId,
              productPrice: product.price,
              quantity: 1,
              price: product.price,
              name: product.productName,
              image: product.image,
            });
          }
        

          await cart.save();
          await whislistModel.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } }
          );
          res.status(200).json({
            success: true,
            message: "Item added to cart"
          })
        }
      } else {
        console.log("else worked");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500)
      next()
    }
  }


const addToWHislist = async (req, res ,next) => {
  try {
    console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm");
    
      console.log("usfguesihteyuhregtfgesuifysgeuyfguesygjfyugesyufgsyufguesgfuygyufgyueegfyugsyudfgyusdg");
      const {
        userId,
        productId 
      } = req.body
      console.log(req.body);

      const product = await productModel.findById(productId);
      if (!product) {
        res.status(404)
        next()
      }

      const user = await customerModel.findById(userId);
      if (!user) {
        res.status(404)
        next()
      }
      const whislist = await whislistModel.findOne({
        user: userId
      })
      if (!whislist) {
        console.log("ffffffffffffffffffffffffffffffff");
        const newWhislist = new whislistModel({
          user: userId,
          items: [{
            product: new mongoose.Types.ObjectId(productId),
            quantity: 1
          }]
        });
        await newWhislist.save();

        res.status(200).json({
          success: true,
          message: "Item added to whishlist"
        });
      } else {
        const whishlistitems = whislist.items.find(item => item.product.equals(productId));
        if (whishlistitems) {
          whishlistitems.productPrice = product.price;
        } else {
          whislist.items.push({
            product: productId,
            productPrice: product.price,
            quantity: 1,
            price: product.price
          });
        }
      }

      await whislist.save();

      res.status(200).json({
        success: true,
        message: "Item added to whishlist"
      })

   
  } catch (error) {
    console.log(error);
    res.status(500)
    next()
  }
}

const whislistGet = async (req, res , next) => {
  try {
  

      let user = (req.session.email) ? await customerModel.findOne({
        email: req.session.email
      }) : null;
      const whishlist = await whislistModel.findOne({
        user: req.session.userId
      })
      console.log(whishlist);
      if (!whishlist) {
        return res.render('whishlist', {
          whishlist: {},
          userId: (user !== null) ? user._id : false
        });
      }

      for (const item of whishlist.items) {
        let data = await productModel.findById(item.product);
        if (data) {
          item.data = data;
          console.log('Product Data:', data); 
        }
      }

      return res.render('whishlist', {
        whishlist: whishlist,
        userId: (user != null) ? user._id : false
      })
   
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  }
}


const getCart = async (req, res ,next) => {
  try {
    const userDetails = await customerModel.findOne({
      email: req.session.user
    })
  
      const userId = req.session.userId
      const category = await CategoryModel.find();
      const cart = await cartModel.findOne({
        userId: userId
      }); 
      const user = true
      if (!cart) {
        return res.render('cart', {
          category: "",
          cart: "",
          user,
          cartItemCount: "",
          userEmail: userDetails.email,
        });
      }
      if (req.session.coupon) {
       req.session.coupon = null
      }

      const cartItemCount = cart ? cart.items.length : 0;
      for (const item of cart.items) {
        let data = await productModel.findById(item.product)
        item.product = data
      }
      cart.billTotal = cart.items.reduce((accumulator, item) => {
        return accumulator += (item.product.price * item.quantity)
      }, 0)
      await cartModel.findByIdAndUpdate(cart._id, {
        $set: {
          billTotal: cart.billTotal
        }
      })
      log(cart.billTotal, '-----------------------')
      return res.render('cart', {
        category,
        cart: cart,
        user,
        cartItemCount: cartItemCount,
        userEmail: userDetails.email,
      });
   
  } catch (error) {
    console.error(error);
    res.status(500)
    next()
  }
}

let checkoutGet = async (req, res , next) => {
  try {
    if (req.session.checkout === true) {
      let user = req.session.userId ? true : false;

      const addresses = await AddressModel.findOne({
        user: req.session.userId
      })
      const coupon = await Coupon.find({status : 'Active'})
      const userDetails = await customerModel.findOne({
        _id: req.session.userId
      })
      const category = await CategoryModel.find();
      console.log(req.session.user)
      const cartCheckout = await cartModel.findOne({
        userId: req.session.userId
      });
      const wallet = await walletModel.findOne({user : req.session.userId })
      console.log(cartCheckout)
      const selectedItems = cartCheckout.items.filter(item => item.selected === true);
      let selectedAddressTypes = []; 

      if (addresses) {
        selectedAddressTypes = addresses.addresses.map((address) => address.addressType);
      }
      let billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
      console.log("//////////////////////////////////////////////////"+billTotal);
      let successFull = ''
      let total = ''
      if (req.session.coupon ) {
        if(billTotal <= req.session.coupon.minPurchase){
         var minPurchaseMesage = `Sorry this coupon minimum purchase is ${req.session.coupon.minPurchase} `
        }else{
         var minPurchaseMesage = null;
        console.log(req.session.coupon.minPurchase);
        console.log('Original billTotal:', billTotal);
        total = billTotal
        billTotal = billTotal - (billTotal * req.session.coupon.minDiscountPercentage)/100 ;      
        req.session.billTotal = billTotal
        var code  =  req.session.coupon.couponCode
        successFull = `Coupon applied ${req.session.coupon.minDiscountPercentage}% OFF successfull`
        }
      } 
      console.log('jsadhasdjjafdgjgdfa'+req.session.coupon);
      // req.session.coupon = null
      let count = 0
      const itemCount = selectedItems.length;
      cartCheckout.items.forEach((item) => {
        if (item.selected === true) {
          count += 1
        }
      })
console.log(selectedItems + "'''''''''''''''''''''''''''''''''''''''''''");
      console.log(count);
      if (count === 0) {
        res.redirect('/cart')
      } else {
        res.render('checkout', {
          user,
          category,
          addresses,
          selectedItems,
          billTotal,
          itemCount,
          selectedAddressTypes,
          coupon,
          successFull,
          code,
          wallet,
          minPurchaseMesage,
          total
        })
      }
    } else {
      res.redirect('/cart')
    }
  } catch (err) {
    console.log(err);
    res.status(500)
    next()
  }
}

const CouponApply = async (req, res , next) => {
  try {
    const couponCode = req.body.couponData;
    console.log(couponCode);
    const today = new Date();

    const coupon = await Coupon.findOne({
      couponCode: couponCode,
      status: 'Active',
      validity: { $gte: today }
    });
    if (!coupon) {
      return res.status(201).json({
        success: false,
        message: "Coupon already applied",
      });
    }
    console.log(coupon);

    if (coupon) {
      req.session.coupon = coupon;
      req.session.coupon.couponCode = coupon.couponCode
      res.status(200).json({
        success: true,
      });
    } else {
      req.session.discountedTotal = 0;
      res.status(200).json({
        success: false,
        message: "Invalid coupon code",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500)
    next()
  }
};


let cartRemove = async (req, res , next) => {
  try {
    const product = req.params.product;
    const userId = req.session.userId;

    const cart = await cartModel.findOne({
      userId: userId
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart Not Found'
      })
    }

    const productIndex = cart.items.findIndex((item) => item.product.toString() === product);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    if (cart.items[productIndex].selected) {
      cart.billTotal -= cart.items[productIndex].price;
    }


    cart.items.splice(productIndex, 1);

    await cart.save();
    return res.status(200).json({
      success: true,
      message: 'Product removed from the cart'
    });

  } catch (err) {
    console.log(err);
    res.status(500)
    next()
  }
}

let cartPut = async (req, res , next) => {
  try {
    const producdId = req.params.product;
    const newQuantity = req.body.quantity;
    const userId = req.session.userId;
    const cart = await cartModel.findOne({
      userId: userId
    });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    const cartItem = cart.items.find((item) => item.product.toString() === producdId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    const product = await productModel.findById(producdId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    if (newQuantity >= product.countInStock) {
      return res.status(400).json({
        success: false,
        message: 'Quantity exceeds Currently Out of  stock'
      });
    }
    cartItem.quantity = newQuantity;
    cartItem.price = newQuantity * cartItem.productPrice;
    let total = 0;
    cart.items.forEach((item) => {
      if (item.selected) {
        total += item.price * item.quantity;
      }
    });

    cart.billTotal = total;
    await cart.save(); 
    return res.status(200).json({
      success: true,
      message: 'Quantity updated successfully'
    });

  } catch (err) {
    console.log(err);
    res.status(500)
    next()
  }
}

let cartbillTotalUpdate = async (req, res , next) => {
  try {
    console.log("==================================++==+++++");
    const selectedProductIds = req.body.selectedProductIds;
    const userId = req.session.userId;
    const cart = await cartModel.findOne({
      userId: userId
    });
    console.log(cart)
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart is not found based on user'
      });
    }
    cart.items.forEach((item) => {
      if (selectedProductIds.includes(item.product.toString())) {
        item.selected = true;
      } else {
        item.selected = false; 
      }
    });

    let total = 0;
    cart.items.forEach((item) => {
      if (item.selected) {
        total += item.productPrice * item.quantity;
      }
    });
    cart.billTotal = total;
    console.log(cart.billTotal, total, "-===-=======================--------=-=-=");
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Successfully billtotal updated',
      billTotal: cart.billTotal
    }); 

  } catch (err) {
    console.log(err);
    res.status(500)
    next()
  }
}
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})


let checkoutPost = async (req, res, next) => {
  try {
    req.session.coupon = null;
    if (!req.body.paymentOption || !req.body.addressType) {
      return res.status(400).json({
        success: false,
        error: "Invalid data in the request"
      });
    }
    const cart = await cartModel.findOne({
      userId: req.session.userId
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No items in the cart"
      });
    }
    const data = [];
    for (const item of cart.items) {
      if (item.selected === true) {
        const product = await productModel.findOne({ _id: item.product });
        if (!product) {
          return res.status(400).json({
            success: false,
            error: "Product not found"
          });
        }
        const updatedItem = {
          productId: product._id.toString(), 
          image: product.image,
          name: product.productName,
          productPrice: product.price,
          quantity: item.quantity,
          price: item.price,
        };
        data.push(updatedItem);
      }
    }
    const orderedItems = await OrderModel.find({
      user: req.session.email._id,
      items: {
        $elemMatch: {
          productId: {
            $in: data.map(item => item.productId)
          }
        }
      }
    });

    if (orderedItems.length > 0) {
      data = data.filter(item => !orderedItems.some(orderedItem =>
        orderedItem.items.some(orderedItemItem => orderedItemItem.productId === item.productId)
      ));
    }

    const Address = await AddressModel.findOne({
      user: req.session.userId
    });

    if (!Address) {
      return res.status(400).json({
        success: false,
        error: "User has no address"
      });
    }

    const deliveryAddress = Address.addresses.find(
      (item) => item.addressType === req.body.addressType
    );

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: "Address not found"
      });
    }

    const orderAddress = {
      addressType: deliveryAddress.addressType,
      HouseNo: deliveryAddress.HouseNo,
      Street: deliveryAddress.Street,
      Landmark: deliveryAddress.Landmark,
      pincode: deliveryAddress.pincode,
      city: deliveryAddress.city,
      district: deliveryAddress.district,
      State: deliveryAddress.State,
      Country: deliveryAddress.Country,
    };

    let billTotal = data.reduce((total, item) => total + item.price, 0);
    if (req.session.billTotal) {
      billTotal = req.session.billTotal;
    }

    for (const item of data) {
      const product = await productModel.findOne({
        _id: item.productId
      });

      if (!product || product.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: "Not enough stock for some items"
        });
      }
      product.countInStock -= item.quantity;
      await product.save();
    }
    if (req.body.paymentOption == 'cashOnDelivery') {
      const order = new OrderModel({
        user: req.session.userId,
        cart: cart._id,
        items: data,
        billTotal,
        paymentStatus: 'Success',
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
      });
      await order.save();
      cart.items = cart.items.filter((item) => !item.selected);
      cart.billTotal = 0;
      await cart.save();
      const orderId = order._id;
      req.session.order = order;
      req.session.billTotal = null;
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        orderId: orderId
      });
    } else if (req.body.paymentOption == 'Razorpay') {
      const amount = billTotal * 100; 
      const orderData = new OrderModel({
        user: req.session.userId,
        cart: cart._id,
        items: data,
        billTotal,
        orderId: null,
        paymentStatus: 'Success',
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
      });
      const order = new OrderModel(orderData);
      const options = {
        amount,
        currency: 'INR',
        receipt: 'order',
      };

      razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
        if (!err) {
          order.orderId = razorpayOrder.id;

          try {
            req.session.order = order;
            req.session.billTotal = null;
            res.status(201).json({
              success: true,
              msg: 'Order Created',
              order,
              amount,
              key_id: process.env.RAZORPAY_KEY_ID,
              contact: req.session.userId.mobile,
              name: req.session.userId.username,
              email: req.session.userId.email,
              address: `${orderAddress.addressType}\n${orderAddress.HouseNo} ${orderAddress.Street}\n${orderAddress.pincode} ${orderAddress.city} ${orderAddress.district}\n${orderAddress.State}`,
            });

          } catch (saveError) {
            console.error('Error saving order to the database:', saveError);
            return res.status(400).json({
              success: false,
              msg: 'Failed to save order'
            });
          }
        } else {
          console.error('Error creating Razorpay order:', err);
          return res.status(400).json({
            success: false,
            msg: 'Something went wrong!'
          });
        }
      });
    } else if (req.body.paymentOption == 'Wallet') {
      const wallet = await walletModel.findOne({ user: req.session.userId });
   
      if(!wallet){
        return res.status(409).json({
          success: false,
          error: 'Not enough money to buy'
        });
      }
      if (wallet.balance >= billTotal) {
        const order = new OrderModel({
          user: req.session.userId,
          cart: cart._id,
          items: data,
          billTotal,
          paymentStatus: 'Success',
          paymentMethod: req.body.paymentOption,
          deliveryAddress: orderAddress,
        });

        await order.save();
        cart.items = cart.items.filter((item) => !item.selected);
        const newTransaction = new transactionModel({
          user : req.session.userId,
          wallet: wallet._id,
          amount: -billTotal,
          type: 'Debit', 
      });
      await newTransaction.save();
         wallet.balance -= billTotal
        await wallet.save();
        
        cart.billTotal = 0;
        await cart.save();

        const orderId = order._id;
        req.session.order = order;
        req.session.billTotal = null;
        return res.status(201).json({
          success: true,
          message: 'Order placed successfully',
          orderId: orderId
        });
      } else {
        return res.status(409).json({
          success: false,
          error: 'Not enough money to buy'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment option'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500)
    next()
  }
};

let orderConfirmation = async (req, res , next) => {
  const orderId = req.params.orderId;
  console.log(orderId);
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).json({
      message: "order have error "
    });
  }
  try {
    req.session.checkout = false
    let orderDetails = await OrderModel.findById(orderId)
    console.log(orderDetails);
    if (!orderDetails) {
      return res.status(404).json({
        message: "order have error "
      });
    }

    res.render('orderConfirmation')
  } catch (err) {
    console.log(err);
    res.status(500)
    next()
  }
}
let razorpayVerify = async (req, res) => {
  try {
    console.log("VERIFY EYE/////////////////////////////");
    const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    console.log(body);

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === req.body.razorpay_signature) {
      console.log("Corrected Verify");
      const order = new OrderModel(req.session.order);
      await order.save();
      const updatedOrder = await OrderModel.findOneAndUpdate({
        orderId: req.body.razorpay_order_id
      }, {
        paymentId: req.body.razorpay_payment_id,
        signature: req.body.razorpay_signature,
        paymentStatus: "Success",
      }, {
        new: true
      });
      console.log(updatedOrder)
      if (updatedOrder) {
        const cart = await cartModel.findOne({
          userId: req.session.userId
        });
        console.log(cart)
        cart.items = cart.items.filter((item) => !item.selected);
        cart.billTotal = 0;
        await cart.save();
        return res.json({
          success: true,
          message: 'Order Sucessfully',
          updatedOrder
        })
      } else {
        return res.json({
          success: false,
          message: 'Order Failed Please try Again'
        })
      }
    } else {
      return res.json({
        success: false,
        message: 'Order Failed Please try Again'
      })
    }
  } catch (err) {
    console.log(err);
    return res.render('paymentFailed', {
      title: "Error",
      error: "An error occurred during payment verification",
    });
  }
};

const checkverify = (req, res) => {
  req.session.checkout = true
  console.log("hdfsdfvdvhdh")
  res.redirect('/checkout')
}

module.exports = {
  addtoCart,
  getCart,
  checkoutGet,
  cartRemove,
  cartPut,
  cartbillTotalUpdate,
  checkverify,
  checkoutPost,
  orderConfirmation,
  razorpayVerify,
  addToWHislist,
  whislistGet,
  whishlistAddtoCart,
  CouponApply
}