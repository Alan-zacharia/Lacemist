const bcrypt = require("bcrypt");
const { customerModel } = require("../model/customer")
const {transporter} = require('../nodeMailer');
const crypto = require('crypto')

const newPassword = (req, res) => {
    res.render('newPassword')
}
const forgettPasswordGet = (req, res) => {

    res.render('forgotPassword', {
        message: ""
    })
}

const forgettPasswordPost = async (req, res , next) => {
    try {
        const email = req.body.Email;
        console.log(email);
        const user = await customerModel.findOne({
            email: email
        });
        if (!user) {
            res.status(404).json({
                message: "User is not found"
            });
        } 
        const token = crypto.randomBytes(32).toString('hex');
        await customerModel.updateOne({email},{
            $set : {
                resetToken : token,
                resetTokenExpire : new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }
        })
        const mailOptions = {
            to: email,
            subject : "Password reset request",
            text : `Click the following link to reset your password : http://localhost:4000/reset-password/${token}`,
            html : `<p>Click the following link to reset your password : </p><p><a href="http://localhost:4000/reset-password/${token}">http://localhost:4000/reset-password/${token}</a></p>`,
        };
        
        await transporter.sendMail(mailOptions);
        return res.status(201).json({message : "Reset password link is sent successfully"})

    } catch (error) {
        console.log(error.message);
        res.status(500)
        next()
    }
}

const ResetPasswordGet = async(req,res , next)=>{
    try{
       const Token = req.params.tokenId;
       console.log(Token);
       if(!Token){
        return res.status(404).json({message : "Token not found"});
       }
       const user = await customerModel.findOne({resetToken : Token})
       if(!user){
        res.status(404).json({message : "User not found"});
       }
       if(user.resetTokenExpire && user.resetTokenExpire > new Date()){
        const resetTokenExpire = user.resetToken
        return res.render('newPassword',{user, Token});
       }else{
        return res.status(410).json({message:'The token is expired'})
       }
    }catch(error){
        console.log(error.message);
        res.status(500)
        next()
    }
}
const ResetPasswordPost = async (req, res ,next) => {
    try {
      console.log(req.body);
      const newPassword = req.body.newPassword;
      const confirmnewPassword = req.body.confirmnewPassword;
      const token = req.body.token;
      console.log(token);
  
      if (newPassword !== confirmnewPassword) {
        return res.status(400).json({ message: 'The confirm password and password must be the same' });
      }
  
      const user = await customerModel.findOne({ resetToken: token });
    console.log(user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpire = null;
  
      await user.save(); 
  
      return res.status(200).json({ success: true, message: 'Successfully Password Changed' });
    } catch (error) {
      console.log(error.message + " Reset passwordPost");
      res.status(500)
      next()
    }
  };
  
module.exports = {
    forgettPasswordGet,
    forgettPasswordPost,
    newPassword,
    ResetPasswordGet,
    ResetPasswordPost
}