const express = require('express');
const router = express.Router();
const User = require('../models/user')
const loginContoller = require('../controllers/login');
const {
    check,
    body
} = require('express-validator/check');
router.get('/login', loginContoller.getLogin);

router.post('/login', [
    body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .trim(),
    body('password')
    .isLength({
        min: 5
    })
    .withMessage('Password is not valid')
    .trim(),
], loginContoller.postLogin);

router.post('/logout', loginContoller.postLogout);

router.get('/register', loginContoller.getSignUp);

router.post('/register',
    [check('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .trim()
        .normalizeEmail()
        .custom((value, {
            req
        }) => {
            return User.findOne({
                    email: value
                })
                .then(user => {
                    if (user) {
                        return Promise.reject('Email already exist!');
                    }
                })

        }),
        body('password', 'Password must be greater than 5 and less than 13 and must also be alphanumberic')
        .isLength({
            min: 5,
            max: 8
        })
        .isAlphanumeric(),
        body('confirmpassword')
        .custom((value, {
            req
        }) => {
            if (value !== req.body.password) {
                throw new Error('Password does not match');
            }
            return true;
        })
    ],
    loginContoller.postSignUp
);

router.get('/reset', loginContoller.getReset);

router.post('/reset', loginContoller.postReset);

router.get('/reset/:token', loginContoller.getNewpassword);

router.post('/reset/newpassword', loginContoller.postNewPassword);

module.exports = router;