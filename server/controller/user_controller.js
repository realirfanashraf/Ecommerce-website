//importing modules..!
const bcrypt = require('bcrypt');
const { log } = require("console");
const validator = require('validator');
const userSchema = require('../model/userModel');
const productSchema = require('../model/productModel');
const cartSchema = require('../model/cartModel');
const orderSchema = require('../model/orderModel');
const couponSchema = require('../model/couponModel')
const categorySchema = require('../model/CategoryModel')
const wishlistSchema = require('../model/wishlistModel')
const mongoose = require('mongoose');
const { Number } = require('twilio/lib/twiml/VoiceResponse');
const paypal = require('paypal-rest-sdk')




//home page
exports.homeRoutes = async (req, res) => {
  const user = req.session.user;
  if (user) {
    res.render("user/index", { user});
  } else {
    res.render("user/index");
  }
}

//otplogin page 
exports.otpLogin = async (req, res) => {
  res.render('user/otpLogin')
}

//login page
exports.userLoginForm = (req, res) => {
  const user = req.session.user;
  if (user) {
    res.redirect("/");
  } else {
    res.render("user/login");
  }
};

//signup page 
exports.userSignup = (req, res) => {
  res.render("user/signup");
};

exports.forgotPassword = (req,res)=>{
  res.render("user/forgotPassword")
}

//user login page
exports.userLogin = async (req, res) => {
  const { email, password, 'agree-term': agreeTerm } = req.body;

  const renderError = (message) => {
    return res.render("user/login", { message });
  };

  try {
    if (!agreeTerm) {
      return renderError("You must agree to the Terms of Service to login.");
    }

    const user = await userSchema.findOne({ email });

    if (!user) {
      return renderError("User not found, please register");
    }

    if (user.isBlocked) {
      return renderError("Blocked User");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return renderError("Incorrect password, please try again");
    }

    req.session.user = user;
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.send("An error occurred while logging in.");
  }
};



//logout
exports.logout = (req, res) => {
  req.session.destroy(function (err) {
    console.log("destroy");
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      console.log("redirect");
      res.redirect('/login')
    }
  });
};


//product view page
exports.productView = async (req, res) => {
  const user = req.session.user;
  try {
    const { id } = req.params;
    const product = await productSchema.findById(id);
    if (!product) {
      console.log("product not found");
      res.redirect("/shop");
    }
    return res.render("user/productView", { product, user });
  } catch (error) {
    console.error(error);
    res.redirect("/shop");
  }
};

exports.userCart = async (req, res) => {
  const userId = req.session.user?._id;
  
  if (!userId) {
    return res.redirect("/login");
  }
  
  try {
    const data = await userSchema.findOne({ _id: userId });
    const cart = await cartSchema.findOne({ userId }).populate("products.productId");

    if (cart) {
      console.log(cart);
      const products = cart.products;
      console.log("this is from cart ", cart);
      return res.render("user/cart", { cart, user: req.session.user, products, data: data.address });
    } else {
      return res.render("user/cart", { cart, user: req.session.user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Some error occurred");
  }
};



 exports.addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.id;
     
    if (!userId) {
      return res.redirect("/login");
    }

    let userCart = await cartSchema.findOneAndUpdate(
      { userId: userId },
      { $setOnInsert: { userId: userId, products: [] } },
      { upsert: true, new: true }
    );

    const productIndex = userCart.products.findIndex(
      (product) => product.productId == productId
    );
    const product = await productSchema.findById(productId);
    const total = 1 * product.price;
    if (productIndex === -1) {
      userCart.products.push({ productId, quantity: 1, total });
    } else {
      userCart.products[productIndex].quantity += 1;
      userCart.products[productIndex].total =
        userCart.products[productIndex].quantity * product.price;
    }

    await userCart.save();
    res.status(200).json({ message: 'Product added to the cart successfully' });
    console.log('Product added to cart successfully');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.incrementQuantity = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const cartItemId = req.body.cartItemId;

    const cart = await cartSchema.findOne({ userId }).populate("products.productId");

    if (!cart) {
      return res.json({ success: false, message: "Cart not found." });
    }

    const cartItem = cart.products.find(item => item.productId.equals(cartItemId));

    if (!cartItem) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    const maxQuantity = cartItem.productId.stock;

    if (cartItem.quantity >= maxQuantity) {
      return res.json({
        success: false,
        maxQuantity
      });
    }

    cartItem.quantity += 1;

    const total = cartItem.quantity * cartItem.productId.price;
    cartItem.total = total;
    await cart.save();
    const quantity = cartItem.quantity;

    let subTotal = 0;
    for (let i = 0; i < cart.products.length; i++) {
      subTotal += cart.products[i].total;
    }

    res.json({
      success: true,
      total,
      quantity,
      subTotal
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update quantity" });
  }
};

exports.decrementQuantity = async (req, res) => {
  try {
    const cartItemId = req.body.cartItemId;
    const userId = req.session.user?._id;

    const cart = await cartSchema.findOne({ userId }).populate("products.productId");

    if (!cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    const cartItem = cart.products.find(item => item.productId.equals(cartItemId));

    if (!cartItem) {
      return res.json({ success: false, message: "Cart item not found" });
    }

    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
    }

    const total = cartItem.quantity * cartItem.productId.price;
    cartItem.total = total;
    await cart.save();
    const quantity = cartItem.quantity;

    let subTotal = 0;
    for (let i = 0; i < cart.products.length; i++) {
      subTotal += cart.products[i].total;
    }

    res.json({
      success: true,
      total,
      quantity,
      subTotal
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update quantity" });
  }
};





exports.deleteCartItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user?._id;
    const productDeleted = await cartSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );
    if (productDeleted) {
      res.redirect("/cart");
    } else {
      console.log("product not deleted");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};


exports.userAddress = async (req, res) => {
  const userId = req.session.user?._id;
  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const userAddressData = await userSchema.findOne({ _id: userId });
    console.log(userAddressData,"this data from the user address");
    res.render("user/userAddress", {
      data: userAddressData?.address,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Some error occurred");
  }
};


exports.addAddress = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { name, phone, address, pincode, city, state } = req.body;

    const user = await userSchema.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.address.push({ name, phone, address, pincode, city, state });
    await user.save();

    res.redirect('/userAddress');
  } catch (error) {
    console.error(error);
    res.status(500).send("Error finding/updating user.");
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const addressId = req.params.id;
    const user = await userSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let addressIndex = -1;
    user.address.forEach((address, index) => {
      if (address._id.toString() === addressId) {
        addressIndex = index;
      }
    });

    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }

    user.address.splice(addressIndex, 1);

    await user.save();
    res.redirect('/userAddress');
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};



exports.checkoutPage = async (req, res) => {
  if (req.session.user) {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const coupon = await couponSchema.find()
      const userObj = new mongoose.Types.ObjectId(userId)
      const user = await userSchema.findOne(
        { _id: userId },
        { address: { $elemMatch: { _id: id } } }
      );
      const cart = await cartSchema
        .findOne({ userId: user })
        .populate("products.productId");
        let totalAmount = await cartSchema.aggregate([
          {
            $match: {
              userId: userObj
            }
          },
          {
            $match: {
              "products": {
                "$exists": true
              }
            }
          },
          {
            $unwind: "$products"
          },
          {
            $group: {
              "_id": null,
              "totalAmount": {
                "$sum": "$products.total"
              }
            }
          }
        ])
        totalAmount = totalAmount[0].totalAmount
      if (user) {
        const address = user.address[0];
        console.log(address);   
          res.render("user/checkout", { user, cart, address,totalAmount,coupon });
   
      } else {
        res.status(404).send("Address not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  } else {
    res.redirect("/login");
  }
};



let paypalTotal = 0;
exports.placeOrder = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const payment = req.body.payment;
      let totalAmount
      if(req.session.totalAmount){
        totalAmount = req.session.totalAmount
      }else{
        totalAmount = parseInt(req.body.totalAmount);
      }

      const currentUser = await userSchema.findOne({ _id: userId });
      if (!currentUser) {
        return res.status(404).send('User not found');
      }

      const addressIndex = currentUser.address.findIndex((item) => item._id.equals(id));
      const specifiedAddress = currentUser.address[addressIndex];
      if (!specifiedAddress) {
        return res.status(404).send('Address not found');
      }

      const cart = await cartSchema.findOne({ userId: userId }).populate('products.productId');

      if (!cart) {
        console.log('Cart not found');
      }

      const items = cart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const total = item.total;

        if (!product) {
          throw new Error('Product is required');
        }
        return {
          product: product._id,
          quantity: quantity,
          total: total,
        };
      });

      console.log(items);

      if (payment === 'cod') {
        const order = new orderSchema({
          user: userId,
          items: items,
          status: 'Pending',
          payment_method: payment,
          createdAt: new Date(),
          totalAmount: totalAmount,
          address: specifiedAddress,
        });
        await order.save();
        await cartSchema.deleteOne({ userId: userId });
        const user = await userSchema.findById(userId);
          user.coupon.push(req.session.couponId);
          await user.save();


        res.render('user/order_confirm', { user: user, order: order });
      } else if (payment === 'wallet'){
        
        
        const order = new orderSchema({
          user: userId,
          items: items,
          status: 'Pending',
          payment_method: payment,
          createdAt: new Date(),
          totalAmount: totalAmount,
          address: specifiedAddress,
        });
        const user = await userSchema.findById(userId);
        await order.save();
        await cartSchema.deleteOne({ userId: userId });
        
        user.coupon.push(req.session.couponId);
        user.wallet -= totalAmount;
        
        await user.save();
        
        res.render('user/order_confirm', { user: user, order: order });
      }
       else if (payment === 'paypal') {
        const order = new orderSchema({
          user: userId,
          items: items,
          status: 'Pending',
          payment_method: payment,
          createdAt: new Date(),
          totalAmount: totalAmount,
          address: specifiedAddress,
        });
        await order.save();
        const user = await userSchema.findById(userId);
        user.coupon.push(req.session.couponId);
        await user.save();

        paypalTotal = totalAmount;

        let createPayment = {
          intent: 'sale',
          payer: { payment_method: 'paypal' },
          redirect_urls: {
            return_url: `http://localhost:8000/paypal-success/${userId}`,
            cancel_url: 'http://localhost:8000/paypal-err',
          },
          transactions: [
            {
              amount: {
                currency: 'USD',
                total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
              },
              description: 'Super User Paypal Payment',
            },
          ],
        };

        paypal.payment.create(createPayment, function (error, payment) {
          if (error) {
            console.log(error);
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === 'approval_url') {
                res.redirect(payment.links[i].href);
              }
            }
          }
        });

        await cartSchema.deleteOne({ userId: userId });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Checkout failed!');
    }
  } else {
    res.redirect('/login');
  }
};

exports.paypal_success = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const userId = req.params.id;
  const user = await userSchema.findOne({ _id: userId });

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: paypalTotal.toFixed(2),
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      if (error.response && error.response.name === 'PAYER_ACTION_REQUIRED') {
        // Redirect the buyer to the PayPal resolution link
        const resolutionLink = error.response.links.find(link => link.rel === 'https://uri.paypal.com/rel/resolution');
        if (resolutionLink) {
          res.redirect(resolutionLink.href);
        } else {
          // Handle the case when resolution link is not available
          console.log('Resolution link not found.');
          throw error;
        }
      } else {
        console.log(error);
        throw error;
      }
    } else {
      console.log(JSON.stringify(payment));
      req.session.user = user;
      console.log(user);
      res.render('user/paypal_success', { payment, user, userId });
    }
  });
};

exports.paypal_err = (req, res) => {
  console.log('Hi Error');
  console.log(req.query);
  res.send('error');
};





exports.myAccount = async (req, res) => {
  const userId = req.session.user?._id;
  const user = req.session.user;
  const orders = await orderSchema.find({ user: userId });
  console.log(orders,"this is from orders");
  const userAddressData = await userSchema.findOne({ _id: userId });
  if (user) {
    res.render("user/userProfile", { user, data: userAddressData?.address, order: orders });
  }
};

exports.userOrdersListDetail = async(req,res)=>{
  const {id} = req.params
  const orders = await orderSchema.findOne({_id:id}).populate('items.product')
  console.log(orders)
  res.render('user/userOrdersListDetail',{orders})
}



exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderSchema.findById(id);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (order.status === "Pending" || order.status === "Shipped") {
      const updatedOrder = await orderSchema.findByIdAndUpdate(
        id,
        { status: "Cancelled" },
        { new: true }
      );

      if (order.payment_method === "paypal") {    
        const user = await userSchema.findById(order.user);
        if (user) {       
          const updatedWalletAmount = user.wallet + order.totalAmount;
          await userSchema.findByIdAndUpdate(order.user, {
            wallet: updatedWalletAmount,
          });
        } else {
          return res.status(404).send("User not found.");
        }
      }
      return res.status(200).json(updatedOrder);
    } else {
      return res.status(400).send("Cannot cancel or return this order");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

exports.returnOrder = async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login");
  }

  try {
    const id = req.params.id;
    const order = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: "Returned",
      },
      { new: true }
    );

    if (order) {
      const updatedWalletAmount = user.wallet + order.totalAmount;
      await userSchema.findByIdAndUpdate(order.user, {
        wallet: updatedWalletAmount,
      });
    } else {
      return res.status(400).send("Order not found.");
    }

    return res.redirect("/orderDetails");
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error");
  }
};


exports.redeemCoupon = async (req, res) => {
  try {
      const {couponCode} = req.body;
      console.log(couponCode);
     
      const userId = req.session.user?._id;
      const coupon = await couponSchema.findOne({code:couponCode});

      if(!coupon){
          return res.json({success: false, message: 'Coupon Unavailable'});
      } 

      if(coupon.expiryDate < Date.now()){
          return res.json({success: false, message: 'Coupon Expired'});
      }
      
      const user = await userSchema.findById(userId);

      if(user.coupon.includes(coupon._id)){
          return res.json({success: false, message: 'Coupon has already used'});
      } 

      const cart = await cartSchema.findOne({ userId: userId }).populate()
           let orderTotal = 0;


        for (const product of cart.products) {
          orderTotal += product.total || 0; 
        }

      if(orderTotal < coupon.minimum){
        return res.json({success: false, message:`mininum purchase for the order is ${coupon.minimum}`})
      }

      if(orderTotal < coupon.discount){ 
          return res.json({success: true, message: 'Coupon amount exceeds cart total'});
      }

      
        var discountPercentage = parseFloat(coupon.discount.replace('%', ''));
        var discount = (discountPercentage / 100) * orderTotal;
        orderTotal -= discount
        
      
      cart.totalAmount = orderTotal+50; 
      await cart.save();
      req.session.totalAmount = orderTotal + 50
      req.session.couponId = coupon._id


      return res.json({success: true, discountAmount: coupon.discount, orderTotal:req.session.totalAmount});

  } catch (error) {

      console.log(error, "Error Occured while coupon redeem");
  }
}





exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const productId = req.params.id;
   
console.log(productId,"333333333333333333333");
    let userWishlist = await wishlistSchema.findOneAndUpdate(
      { userId: userId },
      { $setOnInsert: { userId: userId, products:[]} },
      { upsert: true, new: true }
    );

    const product = await productSchema.findById(productId);
    userWishlist.products.push({ productId });
    await userWishlist.save();
    res.status(200).json({ message: 'Product added to the wishlist successfully' });
    console.log('Product added to wishlist successfully');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.userWishlist = async(req,res)=>{
  const userId = req.session.user?._id;
  
  if (!userId) {
    return res.redirect("/login");
  }
  
  try {
    const data = await userSchema.findOne({ _id: userId });
    const wishlist = await wishlistSchema.findOne({ userId }).populate("products.productId");
    if (wishlist) {
      const products = wishlist.products;
      return res.render("user/wishlist", { wishlist, user: req.session.user, products, data: data.address });
    } else {
      return res.render("user/wishlist", { user: req.session.user });
    }

  } catch (error) {
    console.log(error);
  }
}



exports.deleteWishlistItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user?._id;
    const productDeleted = await wishlistSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );
    if (productDeleted) {
      res.redirect("/wishlist");
    } else {
      console.log("product not removed");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};  



exports.shop = async (req, res) => {
  try {
    const user = req.session.user;
    const products = await productSchema.find();

    if (user) {
      res.render("user/shop", { products, user });
    } else {
      res.render("user/shop", { products });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.sortSearchFilterPagination = async (req, res) => {
  try {
    const {
      selectedSort,
      selectedPriceRange,
      selectedBrand,
      searchQuery,
      selectedPage,
    } = req.query;
       console.log(req.query,"this is from query");

    const sortOptions = {};

    if (selectedSort === "lowtohigh") {
      sortOptions["price"] = 1;
    } else if (selectedSort === "hightolow") {
      sortOptions["price"] = -1;
    }

    let query = {};
    const selectedBrandsArray = selectedBrand.split(',');
    if (selectedBrandsArray.includes("all brands")) {
      // If "all brands" is selected, do not filter by brand
    } else {
      query["brand"] = { $in: selectedBrandsArray };
    }

    if (selectedPriceRange !== "All") {
      const [minPrice, maxPrice] = selectedPriceRange.split("-").map(item => parseInt(item, 10));
      query["price"] = { $gte: minPrice, $lte: maxPrice };
    }
    

    if (searchQuery) {
      query["name"] = { $regex: new RegExp(searchQuery, "i") };
    }

    const totalCount = await productSchema.countDocuments(query);

    // Calculate skip and limit for pagination
    const skip = (parseInt(selectedPage) - 1) * 6; // Assuming 10 products per page
    const limit = 6; // Number of products per page

    // Fetch the products based on the query
    const products = await productSchema.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    

    // Send the response as JSON with the fetched products and pagination details
    res.json({
      totalProducts: totalCount,
      currentPage: parseInt(selectedPage),
      totalPages: Math.ceil(totalCount / limit),
      products,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
}


exports.invoice = async (req, res)=>{
  try {
    const { id } = req.params;
    const orders = await orderSchema.findOne({_id:id}).populate('items.product')
    res.render("user/invoice",{orders})
  } catch (error) {
    console.log(error);
  }

  
}