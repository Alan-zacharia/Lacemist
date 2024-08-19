const adminModel = require('../model/admin');

const adminAuthentication = async(req,res,next)=>{
try{
    req.session.admin = "652cf28b70df7ea4817bdc06"
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin/')
    }
}catch(error){
    console.log(error.message);
}
}

module.exports= {adminAuthentication}