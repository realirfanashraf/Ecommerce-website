const express = require('express');
const route = express.Router();
const admin_controller = require('../controller/admin_controller');
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const multer = require('multer');
const categorySchema=require('../model/CategoryModel')
const couponSchema = require('../model/couponModel')
const middleware = require('../middleware/middleware')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads'); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + ext); // Set a unique filename for each uploaded file
    }
  });
  
 const upload = multer({ storage: storage });


route.get('/',admin_controller.adminLoginForm);
route.post('/',admin_controller.adminLogin);
route.get('/dashboard', admin_controller.dashboard);
route.get('/categoriesList',middleware.checkLoggedIn,admin_controller.findCategory)
route.get('/addCategory',middleware.checkLoggedIn,admin_controller.renderAddCategoryForm)
route.post('/addCategory', admin_controller.addCategory)
route.get('/deleteCategory/:id', admin_controller.deleteCategory);







route.get('/productsList', middleware.checkLoggedIn, admin_controller.findProduct);
route.get('/addProduct', middleware.checkLoggedIn, admin_controller.addProductForm);
route.post('/addProduct', upload.array('image',6), admin_controller.addProduct);
route.get('/deleteProduct/:id', admin_controller.deleteProduct);
route.get('/blockProduct/:id', admin_controller.blockProduct);
route.get('/unblockProduct/:id', admin_controller.unblockProduct);



route.get('/usersList', middleware.checkLoggedIn, admin_controller.findUser)
route.get('/blockUser/:id', admin_controller.blockUser)
route.get('/unblockUser/:id', admin_controller.unblockUser)
route.get('/ordersList',admin_controller.ordersList)
route.get('/ordersListDetail/:orderId',admin_controller.ordersListDetail)
route.post('/updateOrderStatus/:orderId', admin_controller.updateOrderStatus)


route.get('/addCoupon',admin_controller.addCouponPage)
route.get('/couponsList',admin_controller.couponsList)
route.post('/addCoupon',admin_controller.addCoupon)
route.get('/delete/:id',admin_controller.deleteCoupon)
route.get('/activate/:id',admin_controller.activateCoupon)
route.get('/deactivate/:id',admin_controller.deactivateCoupon)

route.get('/salesReport',admin_controller.showSalesReport)
route.get('/exportSalesExcel',admin_controller.exportSalesExcel)


module.exports = route;