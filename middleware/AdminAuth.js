const adminModel = require('../model/admin');

const adminAuthentication = async(req,res,next)=>{
try{
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