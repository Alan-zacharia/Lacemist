const {productModel} = require("../model/product");
const CategoryModel = require("../model/category");

const Items_Page = 5;
const productManagementGet = async (req, res) => {
    try {
        let query = {};
        let search =''
        let page = 1; 
        if(req.query.search){
            search = req.query.search
        }
        if(req.query.page && parseInt(req.query.page)){
            page = parseInt(req.query.page);
        }
        const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const totalItems = await productModel.countDocuments({
            $or :[
                {productName: { $regex: new RegExp(sanitizedSearch, 'i') }},
                {brand: { $regex: new RegExp(sanitizedSearch, 'i') }},
                
            ]
        });
        const totalPages = Math.ceil(totalItems/Items_Page);
        const skip = (page - 1) * Items_Page;
        const selectedCategory = req.query.category || ''; 
        if (selectedCategory) {
            query.category = selectedCategory;
        }
        const products = await productModel.find({
            $or : [
                  {productName: { $regex: new RegExp(sanitizedSearch, 'i') }},
                {brand: { $regex: new RegExp(sanitizedSearch, 'i') }},
            ],
            ...query
        })
            .populate('category')
            .sort({ createdAt: -1 }) 
            .lean()
            .skip(skip)
           .limit(Items_Page);;

        const categories = await CategoryModel.find().lean();
        res.render('products', { products,categories,selectedCategory,totalPages,currentPage:page,search, pagetitle: 'Products' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

const productCategories = async (req, res) => {
    try { 
        const categories = await CategoryModel.find({}, 'name');
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const productManagementCreate = async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.files);
         let pName = req.body.productName;
         let pDescription =req.body.description;
         let offer=req.body.offerScheme;
         let price = req.body.price
         let newPrice;
         let oldPrice = req.body.price ;
         let image;
         let images;
         
         if (req.files) {
      if (req.files['image']) {
        image = req.files['image'][0].path.replace(/\\/g, '/').replace('public/', '');
    }
    if (req.files['images']) {
        images = req.files['images']
        ? req.files['images'].map(file => file.path.replace(/\\/g, '/').replace('public/', ''))
        : [];
    }
         }
   
         if(offer){
            newPrice = Math.floor(oldPrice - (oldPrice * offer) / 100)
         }else{
            newPrice = price
         }

        const product = new productModel({
            productName: pName,
            description: pDescription,
            image: image,
            images: images, 
            brand: req.body.brand,
            countInStock: req.body.countInStock,
            category: req.body.category,
            price: newPrice,
            oldPrice :  oldPrice,
            offer:offer
        });
         req.session.OfferId = product._id
        const savedProduct = await product.save();
        const category = await CategoryModel.findById(savedProduct.category);
        if (category) {
            category.products.push(savedProduct._id);
            await category.save();
        }
        console.log('Product saved successfully.');
        return res.status(201).redirect('/admin/product-management');
    } catch (error) {
        console.error('Error adding product: ' + error);
        return res.status(500).send({ error: 'Internal Server Error', errorMessage: error.message + "/////" });
    }
};
   
    const productManagementEdit = async (req, res) => {
        try {
            const productId = req.params.Id;
            const {
                productName,
                description,
                brand,
                countInStock,
                category,
                offer,
                price,
                deleteImage,
            } = req.body;
            console.log('Request Body:', req.body);
            let image;
            let images;
            let newPrice;
            if (req.files) {
                if (req.files['image']) {
                    image = req.files['image'][0].path.replace(/\\/g, '/').replace('public/', '');
                }
                if (req.files['images']) {
                    images = req.files['images'].map((file) =>
                        file.path.replace(/\\/g, '/').replace('public/', '')
                    );
                }
            }
            const products = await productModel.findById(productId);
            let oldPrice = products.oldPrice;
            if (deleteImage && products) {
              const deleteImageIndex = parseInt(deleteImage, 10);
            
              if (!isNaN(deleteImageIndex) && Array.isArray(products.images)) {
                products.images.splice(deleteImageIndex, 1);
                await products.save();
              }
            }
            if(offer){
            newPrice = Math.floor(oldPrice - (oldPrice * offer) / 100);
            }else{
            newPrice = price
            }
            const updatedProduct = await productModel.findByIdAndUpdate(
                productId,
                {
                    productName,
                    description,
                    brand,
                    countInStock,
                    category,
                    price : newPrice,
                    offer,
                    image,
                    images,
                },
                {
                    new: true,
                }
            );
            const updatedCategory = await CategoryModel.findById(updatedProduct.category);
            if (updatedCategory) {
                updatedCategory.products.push(updatedProduct._id);
                await updatedCategory.save();
            }
            if (!updatedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).redirect('/admin/product-management');
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error', errorMessage: error.message });
        }
    };
    
const productManagementDelete =  async (req, res) => {
    const { productId } = req.params;
    try {
        const deletedProduct = await productModel.findOneAndDelete({ _id: productId });
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const productManagementPublish =  async (req, res) => {
    try {
        let {id} = req.body
        let productDetails = await productModel.findById(id)
        if(productDetails.isFeatured){
            productDetails.isFeatured = false
            await productDetails.save()
            res.status(200).json({status: true})
        } else if(!productDetails.isFeatured){
            productDetails.isFeatured = true
            await productDetails.save()
            res.status(201).json({status: true})
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports ={ productManagementGet,
    productManagementCreate,
    productCategories,
    productManagementEdit,
    productManagementDelete,
    productManagementPublish,
  }






