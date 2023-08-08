const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const userSchema = require('../model/userModel');
const productSchema = require("../model/productModel");
const categorySchema = require("../model/CategoryModel");
const orderSchema = require("../model/orderModel")
const couponSchema = require('../model/couponModel')
require('dotenv').config(); // Load .env file
const exceljs = require('exceljs');
const pdf = require('html-pdf');






//login ---------------------------------------------------------------------------------------------
exports.adminLoginForm = (req, res) => {
  res.render("admin/adminLogin");
};

exports.adminLogin = (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email === adminEmail) {
      console.log(email, password);
      if (password === adminPassword) {
        req.session.admin = true; 
        res.redirect("admin/dashboard");
      } else {
        res.render("admin/adminLogin", { alert: "Invalid Password" });
      }
    } else {
      res.render("admin/adminLogin", { message: "Invalid Email" });
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred while logging in");
  }
};



// Function to fetch delivered revenue data from the database
async function getDeliveredRevenueData() {
  try {
    const deliveredOrders = await orderSchema.find({ 'items.statusProduct': 'Delivered' })
      .select('createdAt totalAmount')
      .exec();

    const revenueData = [];
    const groupedOrders = deliveredOrders.reduce((acc, order) => {
      const monthYear = `${order.createdAt.getMonth() + 1}-${order.createdAt.getFullYear()}`;
      acc[monthYear] = (acc[monthYear] || 0) + order.totalAmount;
      return acc;
    }, {});

    for (const monthYear in groupedOrders) {
      revenueData.push({ month: monthYear, amount: groupedOrders[monthYear] });
    }

    return revenueData;
  } catch (error) {
    console.error('Error fetching delivered revenue data:', error);
    return [];
  }
}



//category-------------------------------------------------------------------------------

exports.findCategory = async (req, res) => {
  try {
    const categories = await categorySchema.find();
    res.render("admin/categoriesList", { categories });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};


exports.renderAddCategoryForm = (req, res) => {
  res.render('admin/addCategory');
};

exports.addCategory = async (req, res) => {
  try {
    const { category } = req.body;

    const existingCategory = await categorySchema.findOne({ name: { $regex: new RegExp(category, 'i') } });
    if (existingCategory) {
      return res.render("admin/addCategory", {
        message: "Category already exists.",
      });
    }

    const newCategory = new categorySchema({ name: category });
    await newCategory.save();

    // Add success message
    const successMessage = "Category saved successfully.";

    res.render("admin/addCategory", {
      message: successMessage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message:
        error.message ||
        "Some error occurred while creating a create operation.",
    });
  }
};


exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await categorySchema.findByIdAndRemove(id);
    res.redirect("/admin/categoriesList");
  } catch (error) {
    res.status(500).send(error.message);
  }
};


//product-------------------------------------------------------------------

exports.findProduct = async (req, res) => {
  try {
    const products = await productSchema.find().exec();
    res.render("admin/productsList", { products });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

exports.addProductForm = async (req, res) => {
  try {
    const data = await categorySchema.find();
    console.log(data);
    res.render("admin/addProduct", { data });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};





exports.addProduct = async (req, res) => {
  try {

    const product = new productSchema({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      description: req.body.description,
      brand: req.body.brand
    });

    const croppedImages = [];
    const originalImages = [];

    for (const file of req.files) {
      const croppedImage = `cropped_${file.filename}`;
      const originalImage = `original_${file.filename}`;
      await sharp(file.path)
      .resize(1280, 720)
      .toFile(path.resolve(file.destination, originalImage));
      originalImages.push(originalImage);

      await sharp(file.path)
        .resize(371, 178, { fit: 'cover' })
        .toFile(path.resolve(file.destination, croppedImage));

      croppedImages.push(croppedImage);
    }

    product.image = croppedImages;
    product.originalImage = originalImages;

    await product.save();

    res.redirect('/admin/productsList');
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message || 'Some error occurred' });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await productSchema.findByIdAndRemove(id);
    if (result) {
      res.redirect("admin/productsList");
    } else {
      res.redirect("admin/productsList");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.blockProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await productSchema.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      { new: true }
    );
    if (result) {
      res.redirect("admin/productsList");
    } else {
      res.redirect("admin/productsList");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.unblockProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await productSchema.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      { new: true }
    );
    if (result) {
      res.redirect("admin/productsList");
    } else {
      res.redirect("admin/productsList");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};



//user---------------------------------------------------------------------------------
exports.findUser = async (req, res) => {
  try {
    const users = await userSchema.find().exec();
    res.render("admin/usersList", { users: users });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};



exports.blockUser = (req, res) => {
  const id = req.params.id;
  userSchema
    .findByIdAndUpdate(
      id,
      {
        
        isBlocked: true,
      },
      { new: true }
    )
    .then((updatedUser) => {
      res.redirect("/admin/usersList");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user");
    });
};

exports.unblockUser = (req, res) => {
  const id = req.params.id;
  userSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      { new: true }
    )
    .then((updatedUser) => {
      res.redirect("/admin/usersList");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user");
    });
};

exports.ordersList = async (req,res)=>{
  const orders = await orderSchema.find()

  res.render('admin/ordersList',{orders})
}

exports.ordersListDetail = async(req,res)=>{
  const {orderId} = req.params
  const orders = await orderSchema.findOne({_id:orderId}).populate('items.product')
  res.render('admin/ordersListDetail',{orders})
}




exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params; // Keep the orderId from req.params
    const { status } = req.body; // Use status instead of statusProduct

    await orderSchema.findByIdAndUpdate(
      orderId,
      { $set: { status } } // Update the status field of the order
    );
    res.redirect(`/admin/ordersListDetail/${orderId}`);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Error updating status' });
  }
};







exports.addCouponPage = async (req,res)=>{
  try {
    const admin = req.session.admin;
    res.render('admin/addCoupon');
} catch (error) {
    console.log(error);
}
}


exports.couponsList = async(req,res)=>{
  try {
    const admin = req.session.admin;
    const couponData = await couponSchema.find();
    res.render('admin/couponsList', {couponData});
} catch (error) {
    console.log(error);
}
}







exports.deleteCoupon = async (req, res) => {
  try {
      const couponId = req.params.id;
      const couponData = await couponSchema.findById(couponId);
      if(!couponData){
          res.status(404).json({message: 'Coupon Not Found'});
      }

      await couponData.deleteOne();

      res.redirect('/admin/couponsList');

  } catch (error) {
      console.log(error);
  }
}

exports.activateCoupon = async (req, res) => {
  try{
      const couponId = req.params.id;
      await couponSchema.findByIdAndUpdate(couponId,
          {status: true}, 
          {new: true});

      res.redirect('/admin/couponsList');

  } catch (error){
      console.log(error);
  }
}



exports.deactivateCoupon = async (req, res) => {
  try {
      const couponId = req.params.id;
      await couponSchema.findByIdAndUpdate(couponId,
          {status: false},
          {new: true});   
      res.redirect('/admin/couponsList');
  } catch (error) {
      console.log(error);
  }
}



exports.addCoupon = async (req, res) => {
  try {
      const {code, discount, description, expiryDate,minimum} = req.body;

      if(discount > 1000){
         return res.render('admin/addCoupon', {message: 'We are not providing offer values above ₹ 1000'});
      }

      if(discount <= 0){
         return res.render('admin/addCoupon', {message: 'Invalid discount entry. Kindly Retry'});
      }

      const currentDate = new Date();
      if(new Date(expiryDate) < currentDate){
          return res.render('admin/addCoupon', {message: 'The Expired date has already passed. Cannot add an expired coupon'});
      }

      const newCoupon = new couponSchema({
          code,
          discount,
          description,    
          expiryDate,
          minimum
      });

      await newCoupon.save();

      res.redirect('/admin/couponsList');
      
  } catch (error) {
      console.log(error);
  }
}








exports.dashboard = async (req, res) => {
  try {
    const admin = req.session.admin;

    // Total Users
    const totalUsers = await userSchema.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    // Total no. of orders
    const totalOrders = await orderSchema.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } }
  ]);
  

    // Total sales by summing up all the purchased products' prices
    const totalSales = await orderSchema.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    

    const deliveredCount = await orderSchema.countDocuments({ status: 'Delivered' });
    const shippedCount = await orderSchema.countDocuments({ status: 'Shipped' });
    const cancelCount = await orderSchema.countDocuments({ status: 'Cancelled' });
    const pendingCount = await orderSchema.countDocuments({ status: 'Pending' });
    const refundedCount = await orderSchema.countDocuments({ status: 'Refunded' });

    // Paypal transactions received
    const paypalDebits = await orderSchema.aggregate([
      { $match: { status: 'Delivered', payment_method: 'paypal' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$items.total', '$items.quantity'] } },
        },
      },
    ]);
    const totalPaypalDebits = paypalDebits.length > 0 ? paypalDebits[0].total : 0;

    // Total amount through cash on delivery
    const amountManually = await orderSchema.aggregate([
      { $match: { status: 'Delivered', payment_method: 'cod' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$items.total', '$items.quantity'] } },
        },
      },
    ]);
    const totalCod = amountManually.length > 0 ? amountManually[0].total : 0;

    // Sales count by month
    const salesCountByMonth = await orderSchema.aggregate([
      { $match: { status: 'Delivered' } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          count: 1,
        },
      },
    ]);

    const totalUsersValue = totalUsers.length > 0 ? totalUsers[0].count : 0;
    const orderCount = totalOrders.length > 0 ? totalOrders[0].count : 0;
    const totalSalesValue = totalSales[0].total;
   

    res.render('admin/dashboard', {
      admin,
      orderCount,
      totalUsersValue,
      totalSalesValue,
      totalPaypalDebits,
      totalCod,
      deliveredCount,
      shippedCount,
      cancelCount,
      pendingCount,
      refundedCount,
      salesCountByMonth,
    });
  } catch (error) {
    // Handle errors here
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



exports.showSalesReport = async (req, res) => {
  try {
      const admin = req.session.admin;
      const salesData = await orderSchema.find().populate('user').populate('items.product')
      const order = await orderSchema.find()
      
      res.render('admin/salesReport', {admin, salesData,order});

  } catch (error) {
      console.log(error);
  }
}



exports.exportSalesExcel = async (req, res) => {
  try {
      const workbook = new exceljs.Workbook();
      const workSheet = workbook.addWorksheet('Sales Report');
  
      workSheet.columns = [
          { header: 'S_no.', key: 's_no.', width: 10 },
          { header: 'Date', key: 'createdAt', width: 15 },
          { header: 'OrderId', key: '_id', width: 30 },
          { header: 'Name', key: 'userName', width: 20 },
          { header: 'Products', key: 'products', width: 35 },
          { header: 'Quantity', key: 'quantity', width: 10 },
          { header: 'Payment method', key: 'payment_method', width: 10 },
          { header: 'Total Amount', key: 'totalAmount', width: 10 }
      ];
  
      let counter = 1;
      const orderData = await orderSchema.find().populate('user').populate('items.product');
  
      orderData.forEach((order) => {
          const orderRow = {
              s_no: counter,
              createdAt: order.createdAt,
              _id: order._id,
              userName: order.user.name,
              products: order.items.map(item => item.product.name).join(", "),
              quantity: order.items.reduce((total, item) => total + item.quantity, 0),
              payment_method: order.payment_method,
              totalAmount: order.totalAmount
          };
  
          workSheet.addRow(orderRow);
          counter++;
      });
  
      workSheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
      });
  
      res.setHeader(
          "Content-Type",
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
  
      res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');
      return workbook.xlsx.write(res).then(() => {
          res.status(200);
      });
  } catch (error) {
      console.log(error);
  }
};

