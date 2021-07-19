const {
  validationResult
} = require('express-validator/check');
const Product = require('../models/product');
const mongoose = require('mongoose');
const fileUnlink = require('../util/file');

exports.getAddProduct = (req, res, next) => {

  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: null,
    validationCss: [],
    product: {
      title: '',
      imageUrl: '',
      price: '',
      description: ''
    }
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      path: '/admin/add-product',
      pageTitle: 'Add Product',
      editing: false,
      errorMessage: 'Image needs to be of .jpeg...',
      validationCss: errors.array(),
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,

      }
    })
  }
  const imageUrl = image.path;
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      path: '/admin/add-product',
      pageTitle: 'Add Product',
      editing: false,
      errorMessage: errors.array()[0].msg,
      validationCss: errors.array(),
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,

      }
    })
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user 
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        validationCss: [],
        errorMessage: null,
        product: {
          title: product.title,
          image: product.imageUrl,
          price: product.price,
          description: product.description,
          _id: product._id
        },

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImage = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      validationCss: errors.array(),
      errorMessage: errors.array()[0].msg,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },

    });
  }
  Product.findOne({
      _id: prodId,
      userId: req.user._id
    })
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (updatedImage) {
        fileUnlink.deleteFile(product.imageUrl);
        product.imageUrl = updatedImage.path;
      }
      return product.save();
    })
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {

  Product.find({
      userId: req.user._id
    })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {

      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Unable to find'));
      }
      fileUnlink.deleteFile(product.imageUrl);
      return Product.findOneAndDelete({
          _id: prodId,
          userId: req.user._id
        })
        .then(() => {
          console.log('DESTROYED PRODUCT');
          res.redirect('/admin/products');
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500
          return next(error);
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })

};