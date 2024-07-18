// utils/otp.js
const nodemailer = require('nodemailer');
const optCache = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// function to send OTP
function sendOTP(email, otp) {
    const mailOptions = {
      from: 'mmustafa2666@gmail.com',
      to: email,
      subject: 'Laundry Portal OTP Verification',
      html: `<h1>OTP for verify OTP</h1><p>Your OTP is ${otp}</p>`
    };
  
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mmustafa2666@gmail.com',
        pass: 'kamoanjvlzoworsm'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
}

module.exports = {
  generateOTP,
  sendOTP,
  optCache
};
