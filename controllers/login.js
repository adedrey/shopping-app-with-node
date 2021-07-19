const User = require('../models/user');
const bcrypt = require('bcryptjs');
const {
  validationResult
} = require('express-validator/check');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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'
  }
}));
exports.getLogin = (req, res, next) => {
  let message = req.flash('error'); 
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: false,
    errorMessage: message,
    validationCss: [],
    oldValue: {
      email: ''
    }
  })
}
exports.getSignUp = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/register',
    pageTitle: 'Register',
    errorMessage: message,
    validationCss: [],
    oldValue: {
      email: '',
      password: '',
      confirmpassword: ''
    }
  })
}
exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmpassword = req.body.confirmpassword;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    console.log(error.array());
    return res.status(422).render('auth/signup', {
      path: '/register',
      pageTitle: 'Register',
      errorMessage: error.array()[0].msg,
      validationCss: error.array(),
      oldValue: {
        email: email,
        password: password,
        confirmpassword: confirmpassword
      }
    });
  }
  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const newUser = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: []
        }
      });
      return newUser.save();
    })
    .then(() => {
      res.redirect('/login');
      return transporter.sendMail({
          to: email,
          from: 'shop@penzaar.com',
          subject: 'Registration Completed',
          html: '<h1>Welcome to Penzaar Shopping Family. Thank you for choosing Kleztech</h1>'
        })
        .catch(err => {
          console.log(err);
        })

    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });
}
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false,
      validationCss: errors.array(),
      errorMessage: errors.array()[0].msg,
      oldValue: {
        email: email
      }
    })
  }
  User.findOne({
      email: email
    })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: false,
          errorMessage: 'Email or password does not match',
          validationCss: [],
          oldValue: {
            email: email
          }
        })
      }
      return bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (!doMatch) {
            return res.status(422).render('auth/login', {
              path: '/login',
              pageTitle: 'Login',
              isAuthenticated: false,
              validationCss: [],
              errorMessage: 'Email or password does not match',
              oldValue: {
                email: email
              }
            })
          }
          req.session.user = user;
          req.session.isLoggedIn = true;
          return req.session.save(err => {
            console.log(err);
            res.redirect('/');
          })
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });
};
exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  })
}
exports.getReset = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  })
}
exports.postReset = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, Buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/login');
    }
    const token = Buffer.toString('hex');
    User.findOne({
        email: email
      })
      .then(user => {
        if (!user) {
          req.flash('error', 'Email does not exist!');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        return transporter.sendMail({
          to: email,
          from: 'shop@penzaar.com',
          subject: 'Reset Password',
          html: `
             <p>Reset password request</p>
             <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to reset your password</p>
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500
        return next(error);
      });

  })

}
exports.getNewpassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
      resetToken: token,
      resetTokenExpiration: {
        $gt: Date.now()
      }
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Token already expired!');
        return res.redirect('/reset');
      }
      let message = req.flash('error');
      if (message > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New password',
        errorMessage: message,
        resetToken: token,
        userId: user._id
      });

    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });

}
exports.postNewPassword = (req, res, next) => {
  const token = req.body.resetToken;
  const newPassword = req.body.password;
  const userId = req.body.userId;
  let authorizedUser;
  User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExpiration: {
        $gt : Date.now()
      }
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Token has expired or does not exist!');
        return res.redirect('/reset');
      }
      authorizedUser = user;
      return bcrypt.hash(newPassword, 12)
        .then(hashedPassword => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        })
        .catch(err => {
          console.log(err);
        })

    })
    .then(() => {
      res.redirect('/login');
      return transporter.sendMail({
        to: authorizedUser.email,
        from: 'shop@penzaar.com',
        subject: 'Password reset successful',
        html: '<p>You have successfully changed your password. Keep shopping!</p>'
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500
      return next(error);
    });
}