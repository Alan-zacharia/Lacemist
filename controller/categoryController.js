const categoryModel = require("../model/category");
const {productModel} = require('../model/product');
const mongoose = require('mongoose')
const {OfferModel} = require('../model/OfferSchema')

const categoryManagementGet = async (req, res) => {
    const Items_Page = 6
    try {
       
         let search = '';
         let page = 1;
         if(req.query.search){
            search = req.query.search;
         }
         if(req.query.page && parseInt(req.query.page)){
            page = parseInt(req.query.page);
         }
         const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         const totalItems = await categoryModel.countDocuments({
           $or : [
            {name:{ $regex: new RegExp(sanitizedSearch, 'i')}},
           ]
         })
         const totalPages = Math.ceil(totalItems/Items_Page);
         const skip = (page - 1) * Items_Page;
         const categories = await categoryModel.find({
        $or : [
          {name : { $regex : new RegExp(sanitizedSearch , 'i')}}
        ]
       })
       .skip(skip)
       .limit(Items_Page)
      if(req.session.categoryErr){
       categoryErr= req.session.categoryErr
       req.session.categoryErr = null
      }else{
        categoryErr = ''
      }
       res.render('category', {
          pagetitle: 'Category',
          categories: categories, 
          totalPages,
          search,
          currentPage : page,
          categoryErr
           
          });
  
    } catch (error) {
       console.error('Error fetching categories:', error);
       res.status(500).send('Internal Server Error');
    }
 };
 
 
 const categoryManagementCreate = async (req, res) => {
     try {
         const { name, description } = req.body;
         let image  =null
         if (req.file) {
 
             image = req.file.path.replace(/\\/g, '/').replace('public/', '');
           }
         const existingCategory = await categoryModel.findOne({
            name: { $regex: new RegExp("^" + name + "$", "i") }
        });
          if (existingCategory) {
            req.session.categoryErr='Category Exists'
            return res.redirect('/admin/category-management');
          }
         const category = new categoryModel({
             name,
             description,
             image
         });
 
         await category.save();
 
         res.status(201).redirect('/admin/category-management');
     } catch (error) {
         console.error(error);
         res.status(500).json({ message: 'Internal Server Error' });
     }
 }
 
 const categoryManagementEdit = async(req,res)=>{
     try {
         let { editName, editDescription } = req.body;
         editName = editName.trim();
         editDescription = editDescription.trim();
         const categoryId = req.params.categoryId;
         const category = await categoryModel.findById(categoryId);
 
         if (!category) {
             return res.status(404).json({ message: 'Category not found' });
         }
         category.name = editName;
         category.description = editDescription;
         if (req.file) {
             const newImage = req.file.path.replace(/\\/g, '/').replace('public/', '');
             category.image = newImage;
         }
         console.log(req.body,req.file);
         await category.save();
 
         res.status(200).redirect('/admin/category-management');
     } catch (error) {
         console.error(error);
         res.status(500).json({ message: 'Internal Server Error' });
     }
 }
 
 
 const categoryManagementFeatured=async (req, res) => {
     try {
         let {categoryId} = req.body
         let data = await categoryModel.findById(categoryId)
         if(data.isFeatured === true) {
             data.isFeatured = false
             await productModel.updateMany({category:new mongoose.Types.ObjectId(categoryId)},{$set:{isFeatured : false}})
             await data.save()
             res.status(200).json({status:true})
         } else if (data.isFeatured === false) {
             data.isFeatured = true
             await productModel.updateMany({category:new mongoose.Types.ObjectId(categoryId)},{$set:{isFeatured : true}})
             await data.save()
             res.status(200).json({status:true})
         }
     } catch (error) {
         console.error(error);
         res.status(500).json({ message: 'Internal Server Error' });
     }
 }
 
 const categoryOffer = async(req,res)=>{
    try{
            const categories = await categoryModel.find()
            res.render('CategoryOffer',{categories ,error : ""})
    }catch(error){
        console.log(error.message);
    }
 }

const categoryOfferPost = async (req, res) => {
    try {
        const { category, discount, expireDate } = req.body;


        if (!category || !discount) {
            return res.status(400).json({ error: 'Category and discount are required.' });
        }

        const categoryDoc = await categoryModel.findOne({ _id: category });
        if (!categoryDoc) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        categoryDoc.offer = discount;
        await categoryDoc.save();

        const percentage = discount / 100;

        await productModel.updateMany(
            { category: categoryDoc._id },
            [
                {
                    $set: {
                        offer: discount,
                    
                        price: {
                            $trunc: {
                                $subtract: [
                                    { $toDouble: '$oldPrice' },
                                    {
                                        $multiply: [
                                            { $toDouble: '$oldPrice' },
                                            percentage
                                        ]
                                    }
                                ]                                   
                            }
                        },
                        offerExpire: expireDate
                    }
                }
            ]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




 
 module.exports = {
    categoryManagementCreate,
    categoryManagementGet,
    categoryManagementEdit,
    categoryManagementFeatured,
    categoryOffer,
    categoryOfferPost
 }






