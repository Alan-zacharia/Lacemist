const nodemailer = require('nodemailer');
const randomsring = require("randomstring");
require('dotenv').config()
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
})

async function sentOtp(email){
    const otp = randomsring.generate({
        length : 6,
        charset:'numeric',
    })
 
    const mailOptions = {
        from : process.env.EMAIL,
        to :email,
        subject : 'Yor otp code for verification',
        text:  ` Your OTP verification code is : ${otp}`,
    };

    transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            console.error("Error sending email : " + error) 
        }else{
            console.log("Email send : ", info.response );
            console.log('OTP : ',otp);
        }
    });
    
    return otp;
}

module.exports = { sentOtp , transporter  };