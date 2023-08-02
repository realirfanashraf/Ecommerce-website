const express = require('express');
const categorySchema=require('../model/CategoryModel')
const userSchema = require('../model/userModel')



exports.checkLoggedIn = (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.render("admin/adminLogin");
    }
  };
  


  
exports.isAuth = (req, res, next) => {
    if (req.session && req.session.user) {
      next();
    } else {
      res.redirect('/login');
    }
  };
  

exports.exUser = (req, res, next) => {
    if(req.session.exUser) {
        console.log('already loginned');
        res.redirect('/', { message: 'already loginned'})
    } else {
        next() 
    }
}

exports.checkBlocked = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;
            const user = await userSchema.findOne({ _id: userId });
            
            if (user && user.isBlocked) { 
                req.session.save(() => {
                    res.redirect('/login');
                });
                return;
            }
        }
        next();
    } catch (error) {
        console.error('Error in isBlocked middleware', error);
        next(error);
    }
}
