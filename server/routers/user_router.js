const express = require('express')
const route = express.Router()
const userSchema = require('../model/userModel')
const user_controller = require('../controller/user_controller')
const middleware = require('../middleware/middleware')


//setting middleware
const authMiddleware = [middleware.checkBlocked, middleware.isAuth];

//login
route.get('/otpLogin',user_controller.otpLogin)
route.get('/',middleware.checkBlocked, user_controller.homeRoutes)
route.get('/signup', user_controller.userSignup)
route.get('/login',middleware.checkBlocked, user_controller.userLoginForm)
route.post('/login',middleware.checkBlocked, user_controller.userLogin)
route.get('/logout',middleware.checkBlocked, user_controller.logout)
route.get('/forgotPassword',middleware.checkBlocked, user_controller.forgotPassword)

route.get('/shop',user_controller.shop)
route.get('/productView/:id',user_controller.productView)


route.get('/cart',authMiddleware,user_controller.userCart)
route.post('/addToCart/:id',user_controller.addToCart)
route.get('/deleteCartItem/:id', authMiddleware,user_controller.deleteCartItem)
route.post('/incrementQuantity', user_controller.incrementQuantity)
route.post('/decrementQuantity', user_controller.decrementQuantity)


route.get('/userAddress',authMiddleware, user_controller.userAddress)
route.post('/userAddress', user_controller.addAddress)
route.get('/deleteAddress/:id', user_controller.deleteAddress);
route.get('/checkout/:id',authMiddleware, user_controller.checkoutPage)
route.post('/checkout/:id', user_controller.placeOrder)

route.get('/paypal-success/:id', user_controller.paypal_success)
route.get('/paypal-success', user_controller.paypal_err)
route.get('/userProfile',user_controller.myAccount)
route.get('/userOrdersListDetail/:id',user_controller.userOrdersListDetail)
route.post('/cancelOrder/:id',user_controller.cancelOrder)
route.post('/returnOrder/:id',user_controller.returnOrder)

route.post('/redeemCoupon',user_controller.redeemCoupon)
route.get('/wishlist',user_controller.userWishlist)
route.post('/addToWishlist/:id',user_controller.addToWishlist)
route.get('/deleteWishlistItem/:id', authMiddleware,user_controller.deleteWishlistItem)
// Backend route for brand filtering



route.post('/shop',user_controller.sortSearchFilterPagination)
route.get('/invoice/:id',user_controller.invoice)
  

module.exports = route