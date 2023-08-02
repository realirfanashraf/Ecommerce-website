require('dotenv').config();
const userSchema = require("../model/userModel");
const bcrypt = require("bcrypt");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const serviceSid = process.env.TWILIO_SERVICE_SID;

// send otp
exports.sendOTP = async (req, res, next) => {
  console.log("Sending OTP...");
  const { phone } = req.body;
  req.session.phone = phone;
  try {
    const user = await userSchema.findOne({ phone: phone });
    if (!user) {
      console.log("Phone number is not registered");
      res.render('user/otpLogin', { message: "Phone number is not registered" });
    } else {
      const otpResponse = await client.verify.v2.services(serviceSid).verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
      console.log("OTP sent successfully");
      res.render('user/otpLogin', { message: "OTP sent successfully" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
  }
};

// verify otp
exports.verifyOTP = async (req, res, next) => {
  console.log("Verifying OTP...");
  const verificationCode = req.body.otp;
  const phoneNumber = req.session.phone;

  if (!phoneNumber) {
    console.log("Phone number is required");
    res.status(400).send({ message: 'Phone number is required' });
    return;
  }
  try {
    const verificationCheck = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: "+91" + phoneNumber,
      code: verificationCode,
    });
    console.log("Verification check status:", verificationCheck.status);
    if (verificationCheck.status === 'approved') {
      // If the verification is successful, do something
      const user = await userSchema.findOne({ phone: phoneNumber });
      console.log("User:", user);
      req.session.user = user;
      res.redirect('/');
    } else {
      console.log("Invalid verification code");
      // If the verification fails, return an error message
      res.render('user/login', { message: "Invalid verification code" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send({ message: error.message || 'Some error occurred while verifying the code' });
  }
};



exports.signupSendOTP = async (req, res, next) => {
  console.log('Sending OTP...');
  const { phone } = req.body;


  try {
    const user = await userSchema.findOne({ phone: phone });

    if (user) {
      console.log('Phone number is already registered');
      return res.render('user/signup', { message: 'Phone number is already registered' });
    }

    const verification = await client.verify.v2.services(serviceSid).verifications.create({
      to: "+91" + phone,
      channel: 'sms',
    });

    console.log('OTP sent successfully');
    req.session.userDet = req.body;
    res.render('user/signupVerifyOtp', { phone: phone });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
  }
};

exports.signupVerifyOTP = async (req, res, next) => {
  console.log('Verifying OTP...');
  const verificationCode = req.body.otp;
  const phone = req.session.userDet.phone;
  const email =  req.session.userDet.email
 

  try {
    const verificationCheck = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: "+91" + phone,
      code: verificationCode,
    });

    console.log('Verification check status:', verificationCheck.status);

    if (verificationCheck.status === 'approved') {
    
      const existingEmail = await userSchema.findOne({ email: req.session.userDet.email });
      const existingPhone = await userSchema.findOne({ phone: phone });

      if (existingEmail) {
        return res.render('user/signup', { msg: "Email already exists" });
      }

      if (existingPhone) {
        return res.render('user/signup', { msg: "Mobile already exists" });
      }

      const saltRounds = 10;
      bcrypt.hash(req.session.userDet.password, saltRounds, async (err, hash) => {
        if (err) {
          res.status(500).send({
            message: err.message || "Some error occurred while hashing the password",
          });
          return;
        }

        const user = new userSchema({
          name: req.session.userDet.name,
          email: req.session.userDet.email,
          phone: phone,
          password: hash,
        });

        try {
          await user.save();
          console.log('User created:', user);
          res.render('user/login', { message: 'Account created successfully. Please log in.' });
        } catch (error) {
          res.status(500).send({
            message: error.message || "Some error occurred while creating a create operation",
          });
        }
      });
    } else {
      console.log('Invalid verification code');
      res.render('user/signupVerifyOtp', { phone: phone, message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send({ message: error.message || 'Some error occurred while verifying the code' });
  }
};



exports.requestPasswordResetOTP = async (req, res, next) => {
  console.log("Requesting password reset OTP...");
  const { phone } = req.body;
  req.session.phone = phone;
  try {
    const user = await userSchema.findOne({ phone: phone });
    if (!user) {
      console.log("Phone number is not registered");
      res.render('user/forgotPassword', { message: "Phone number is not registered" });
    } else {
      const otpResponse = await client.verify.v2.services(serviceSid).verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
      console.log("OTP sent successfully");
      res.render('user/forgotPassword', { message: "OTP sent successfully" });
    }
  } catch (error) {
    console.error("Error sending password reset OTP:", error);
    res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
  }
};




exports.verifyPasswordResetOTP = async (req, res, next) => {
  console.log("Verifying password reset OTP...");
  const verificationCode = req.body.otp;
  const phoneNumber = req.session.phone;

  if (!phoneNumber) {
    console.log("Phone number is required");
    res.status(400).send({ message: 'Phone number is required' });
    return;
  }
  try {
    const verificationCheck = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: "+91" + phoneNumber,
      code: verificationCode,
    });
    console.log("Verification check status:", verificationCheck.status);
    if (verificationCheck.status === 'approved') {
      // If the verification is successful, proceed with password reset
      const user = await userSchema.findOne({ phone: phoneNumber });
      console.log("User:", user);
      req.session.user = user;
      res.render('user/resetPassword');
    } else {
      console.log("Invalid verification code");
      // If the verification fails, return an error message
      res.render('user/forgotPassword', { message: "Invalid verification code" });
    }
  } catch (error) {
    console.error("Error verifying password reset OTP:", error);
    res.status(500).send({ message: error.message || 'Some error occurred while verifying the code' });
  }
};



exports.resetPassword = async (req, res, next) => {
  console.log("Resetting password...");
  const { newPassword, confirmPassword } = req.body;
  const userId = req.session.user._id;
  const user = await userSchema.findOne({_id:userId});


  if (!user) {
    console.log("User not found");
    res.status(400).send({ message: 'User not found' });
    return;
  }

  if (newPassword !== confirmPassword) {
    console.log("Passwords do not match");
    res.render('user/resetPassword', { message: "Passwords do not match" });
    return;
  }

  try {
    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save() ;

    
   
    // Update the user's password
  
   

    console.log("Password reset successful");
    res.render('user/login', { message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send({ message: error.message || 'Some error occurred while resetting the password' });
  }
};
