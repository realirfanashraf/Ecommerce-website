require('dotenv').config()

const express = require('express');

const twilio_sms = require('../controller/twilio-sms');
const router = express.Router();

router.post('/send-otp', twilio_sms.sendOTP);
router.post('/verify-otp', twilio_sms.verifyOTP)

router.post('/signup-getOtp',twilio_sms.signupSendOTP)
router.post('/otp-confirmation',twilio_sms.signupVerifyOTP)


router.post('/requestPasswordResetOTP',twilio_sms.requestPasswordResetOTP)
router.post('/verifyPasswordResetOTP',twilio_sms.verifyPasswordResetOTP)
router.post('/resetPassword', twilio_sms.resetPassword)
module.exports = router;
