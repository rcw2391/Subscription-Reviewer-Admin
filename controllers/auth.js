const bcrypt = require('bcryptjs');

const Admin = require('../models/admin');

exports.getLogin = (req, res, next) => {
    return res.render('login', {
        pageTitle: 'Login',
        isError: false
    });
}

exports.postLogin = (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    Admin.findOne({ username: username }, (err, doc) => {
        if(err) {
            console.log(err);
            throw new Error('Error finding admin.');
        } else {
            if(!doc) {
                return res.render('login', {
                    pageTitle: 'Login',
                    isError: true,
                    error: 'Invalid credentials.'
                });
            } else {
                if(bcrypt.compareSync(password, doc.password)) {
                    req.session.isAuth = true;
                    req.session.save( err => {
                        if(err) {
                            console.log(err);
                            throw new Error('Unable to save session.');
                        } else {
                            return res.redirect('/dashboard');
                        }
                    })
                } else {
                    return res.render('login', {
                        pageTitle: 'Login',
                        isError: true,
                        error: 'Invalid credentials.'
                    });
                }
            }
        }
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy( (err) => {
        if(err) {
            console.log(err);
            throw new Error('Error destroying session.');
        } else {
            return res.redirect('/');
        }
    });
}