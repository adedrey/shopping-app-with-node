const path = require('path');

const express = require('express');

const {
    body
} = require('express-validator/check');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    body('title')
    .isString()
    .isLength({
        min: 3
    })
    .withMessage('Title must be string and more than 3 characters')
    .trim(),
    body('price')
    .isFloat(),
    body('description', 'Character must be greater than 5')
    .isString()
    .isLength({
        min: 5
    })

], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
    .isString()
    .isLength({
        min: 3
    })
    .withMessage('Title must be string and more than 3 characters')
    .trim(),
    body('price')
    .isFloat(),
    body('description', 'Character must be greater than 5')
    .isString()
    .isLength({
        min: 5
    })

], isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;