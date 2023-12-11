const {customerModel}  = require("../model/customer");

const userAuthentication = async (req,res,next)=>{
    try{
        if(req.session.userId){
            let userData = await customerModel.findOne({
                _id:req.session.userId
            })
            if(userData.isBlocked == false){
                next()
            }else{
                req.session.isBlocked = true;
                res.render('user-login', {
                        err: "please Login or sign now"
                      });
            }
        }else{
            res.redirect('/login')
        }
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {userAuthentication};