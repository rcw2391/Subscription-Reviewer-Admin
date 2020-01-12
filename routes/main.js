const express = require('express');

const isAuth = require('../middleware/auth');

const authController = require('../controllers/auth');

const dashController = require('../controllers/dash');

const router = express.Router();

    // AUTH ROUTES //

router.get('/', authController.getLogin);

router.post('/', authController.postLogin);

router.post('/logout', isAuth, authController.postLogout);

    // DASHBOARD ROUTES //
router.get('/dashboard', isAuth, dashController.getDashboard);

router.get('/add-category', isAuth, dashController.getAddCategory);

router.post('/add-category', isAuth, dashController.postAddCategory);

router.get('/category/:id', isAuth, dashController.getCategory);

router.post('/category/:id', isAuth, dashController.postCategory);

router.get('/category/delete/:id', isAuth, dashController.getCategoryDelete);

router.post('/category/delete/:id', isAuth, dashController.postCategoryDelete);

router.get('/category/new-subscription/:id', isAuth, dashController.getAddSubscription);

router.post('/category/new-subscription/:id', isAuth, dashController.postAddSubscription);

router.get('/subscription/edit/:id', isAuth, dashController.getEditSubscription);

router.post('/subscription/edit/:id', isAuth, dashController.postEditSubscription);

router.post('/subscription/delete/:id', isAuth, dashController.postDeleteSubscription);

module.exports = router;