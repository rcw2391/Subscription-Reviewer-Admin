const express = require('express');

const mongoose = require('mongoose');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const path = require('path');

const bodyParser = require('body-parser');

const multer = require('multer');

const MONGO_URI = 'mongodb://localhost:27017/Subscription-Reviewer';

const routes = require('./routes/main');

const app = express();

const store = new MongoDBStore({
    uri: MONGO_URI,
    collection: 'sessions'
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + '-' + file.originalname);
    }
});

const filter = (req, file, cb) => {
    if(file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: storage, fileFilter: filter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use( (req, res, next) => {
    if(req.session.isAuth) {
        res.locals.isAuth = true;
    } else {
        res.locals.isAuth = false;
    }
    next();
});

app.use(routes);

app.use( (err, req, res, next) => {
    console.log(err);
    return res.render('500', {
        pageTitle: '500'
    });
});

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if(err) {
        console.log(err);
    } else {
        console.log('Database connected.');
        app.listen(5000);
    }
});