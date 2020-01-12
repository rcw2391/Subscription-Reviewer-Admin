const Category = require('../models/category');

const Subscription = require('../models/subscription');

const mongoose = require('mongoose');

const fs = require('fs');

exports.getDashboard = (req, res, next) => {
    Category.find({}, null, { sort: { name: 1 } }, (err, categories) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving categories.');
        } else {
            return res.render('dashboard', {
                pageTitle: 'Dashboard',
                categories: categories,
                isError: false
            });
        }
    });
}

exports.getAddCategory = (req, res, next) => {
    return res.render('add-category', {
        pageTitle: 'Add Category',
        isError: false,
        isSuccess: false
    });
}

exports.postAddCategory = (req, res, next) => {
    let name = req.body.name;

    let errors = [];

    if(name.length === 0) {
        errors.push({
            field: 'name',
            msg: 'Name cannot be empty.'
        });
    } else {
        Category.findOne( { name: name }, (err, category) => {
            if(err) {
                console.log(err);
                throw new Error('Error retrieving category.');
            } else {
                
                if (category && category.name.toLowerCase() === name.toLowerCase()) {
                    errors.push({
                        field: 'name',
                        msg: 'A category with that name already exists.'
                    });
                }

                if(errors.length === 0) {
                    let newCategory = new Category({
                        name: name,
                        subscriptions: []
                    });
                    newCategory.save((err) => {
                        if (err) {
                            console.log(err);
                            throw new Error('Unable to save category.');
                        } else {
                            return res.render('add-category', {
                                pageTitle: 'Add Category',
                                isError: false,
                                isSuccess: true,
                                success: 'Category added successfully.'
                            });
                        }
                    });
                } else {
                    return res.render('add-category', {
                        pageTitle: 'Add Category',
                        isError: true,
                        errors: errors,
                        isSuccess: false,
                        name: name
                    });
                }
            }
        })
    }
}

exports.getCategory = (req, res, next) => {
    let id = req.params.id;

    Category.findById(id)
        .populate('subscriptions', '', null, { sort: { name: 1 } })
        .exec( (err, category) => {
            if(err) {
                console.log(err);
                throw new Error('Error retrieving category.');
            } else {
                return res.render('category', {
                    pageTitle: category.name,
                    category: category,
                    isError: false,
                    isSuccess: false
                });
            }
        })
}

exports.postCategory = (req, res, next) => {
    let id = req.params.id;
    let name = req.body.name;

    Category.findById(id, (err, category) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving category');
        } else {
            if(!category) {
                throw new Error('No category found.');
            } else {
                Category.findOne({ name: name }, (err, nameCat) => {
                    if(err) {
                        console.log(err);
                        throw new Error('Error retrieving category.');
                    } else {
                        if(nameCat) {
                            let errors = [{
                                field: 'name',
                                msg: 'Category name is already in use.'
                            }];

                            return res.render('category', {
                                pageTitle: category.name,
                                category: category,
                                isError: true,
                                errors: errors,
                                isSuccess: false
                            });
                        } else {
                            category.name = name;
                            category.save( (err, doc) => {
                                if(err) {
                                    console.log(err);
                                    throw new Error('Error saving category.');
                                } else {
                                    doc.populate('subscriptions', '', null, { sort: { name: 1 } })
                                        .execPopulate( (err, category) => {
                                            if(err) {
                                                console.log(err);
                                                throw new Error('Error populating category.');
                                            } else {
                                                return res.render('category', {
                                                    pageTitle: category.name,
                                                    category: category,
                                                    isError: false,
                                                    isSuccess: true,
                                                    success: 'Category saved successfully.'
                                                });
                                            }
                                        });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
}

exports.getCategoryDelete = (req, res, next) => {
    let id = req.params.id;

    Category.findById(id, (err, category) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving category.');
        } else {
            Category.find({}, null, { sort: { name: 1 } }, (err, categories) => {
                if(err) {
                    console.log(err);
                    throw new Error('Error retrieving categories.');
                } else {
                    return res.render('delete-category', {
                        pageTitle: 'Delete Category',
                        category: category,
                        categories: categories
                    });
                }
            });
        }
    });
}

exports.postCategoryDelete = (req, res, next) => {
    let id = req.params.id;
    let newId = req.body.category;

    Category.findById(id, (err, category) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving category.');
        } else {
            if(category.subscriptions.length === 0) {
                category.remove( (err, doc) => {
                    if(err) {
                        console.log(err);
                        throw new Error('Error deleting category.');
                    } else {
                        return res.redirect('/dashboard');
                    }
                });
            } else {
                Category.findById(newId, (err, newCat) => {
                    if (err) {
                        console.log(err);
                        throw new Error('Error retrieving category.');
                    } else {
                        Subscription.updateMany({ category: category._id }, { category: newCat._id }, (err, docs) => {
                            if (err) {
                                console.log(err);
                                throw new Error('Error updating subscriptions.');
                            } else {
                                console.log(docs);
                                newCat.subscriptions = newCat.subscriptions.concat(category.subscriptions);
                                newCat.save( (err, newCat) => {
                                    if(err) {
                                        console.log(err);
                                        throw new Error('Error saving new category.');
                                    } else {
                                        category.remove( (err, deleted) => {
                                            if(err) {
                                                console.log(err);
                                                throw new Error('Error removing category.');
                                            } else {
                                                return res.redirect('/dashboard');
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });
}

exports.getAddSubscription = (req, res, next) => {
    let id = req.params.id;
    
    Category.findById(id, (err, category) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving category.');
        } else {
            if(!category) {
                throw new Error('Error retrieving category.');
            } else {
                return res.render('add-subscription', {
                    pageTitle: 'Add Subscription',
                    category: category,
                    isError: false,
                    isSuccess: false,
                    isEdit: false
                });
            }
        }
    });
}

exports.postAddSubscription = (req, res, next) => {
    let name = req.body.name;
    let imagePath = req.file.path;
    let desc = req.body.desc;
    let url = req.body.url;
    let id = req.params.id;

    let errors = [];

    if (name.length === 0) {
        errors.push({
            field: 'name',
            msg: 'Name cannot be empty.'
        });
    }
    if (imagePath.length === 0) {
        errors.push({
            field: 'image',
            msg: 'You must upload an image.'
        });
    }
    if (desc.length === 0) {
        errors.push({
            field: 'desc',
            msg: 'Description cannot be empty.'
        });
    }
    if (url.length === 0) {
        errors.push({
            field: 'url',
            msg: 'URL cannot be empty.'
        });
    }

    Category.findById(id, (err, category) => {
        Subscription.findOne({ url: url }, (err, subscription) => {
            if(subscription) {
                errors.push({
                    field: 'url',
                    msg: 'A Subscription with that URL already exists.'
                });
            }

            Subscription.findOne({ name: name }, (err, nameSub) => {
                if(nameSub) {
                    errors.push({
                        field: 'name',
                        msg: 'A Subscription with that name already exists.'
                    });
                }

                if (errors.length !== 0) {
                    const fs = require('fs');

                    fs.unlinkSync(imagePath);
                    
                    return res.render('add-subscription', {
                        pageTitle: 'Add Subscription',
                        category: category,
                        isError: true,
                        errors: errors,
                        isSuccess: false,
                        oldInput: {
                            name: name,
                            desc: desc,
                            url: url
                        },
                        isEdit: false
                    });
                } else {
                    let newSub = new Subscription({
                        name: name,
                        imagePath: imagePath,
                        desc: desc,
                        url: url,
                        category: category._id
                    });

                    newSub.save( (err,doc) => {
                        if(err) {
                            console.log(err);
                            throw new Error('Error saving new subscription.');
                        } else {
                            category.subscriptions.push(doc._id);
                            category.save( (err, doc) => {
                                if(err) {
                                    console.log(err);
                                    throw new Error('Error adding subscription to category.');
                                } else {
                                    return res.render('add-subscription', {
                                        pageTitle: 'Add Subscription',
                                        category: category,
                                        isError: false,
                                        errors: errors,
                                        isSuccess: true,
                                        success: 'Subscription succesfully added.',
                                        isEdit: false
                                    });
                                }
                            })
                        }
                    })
                }
                
            })
        })
    });
}

exports.getEditSubscription = (req, res, next) => {
    let id = req.params.id;

    Subscription.findById(id, (err, subscription) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving subscription.');
        } else {
            Category.find({}, null, { sort: { name: 1 } }, (err, categories) => {
                return res.render('add-subscription', {
                    pageTitle: 'Add Subscription',
                    category: subscription.category,
                    isError: false,
                    isSuccess: false,
                    isEdit: true,
                    categories: categories,
                    oldInput: {
                        name: subscription.name,
                        desc: subscription.desc,
                        url: subscription.url,
                        category: subscription.category
                    },
                    id: subscription._id
                });
            });
        }
    })
}

exports.postEditSubscription = (req, res, next) => {
    let name = req.body.name;
    let imagePath;
    let oldPath;
    let desc = req.body.desc;
    let url = req.body.url;
    let id = req.params.id;
    let category = req.body.category;

    let errors = [];

    if (name.length === 0) {
        errors.push({
            field: 'name',
            msg: 'Name cannot be empty.'
        });
    }
    if (desc.length === 0) {
        errors.push({
            field: 'desc',
            msg: 'Description cannot be empty.'
        });
    }
    if (url.length === 0) {
        errors.push({
            field: 'url',
            msg: 'URL cannot be empty.'
        });
    }

    const completePost = (subscription, category, saveSub) => {
        let name = saveSub.name;
        let desc = saveSub.desc;
        let url = saveSub.url;
        let imagePath = saveSub.imagePath;
        let oldPath = saveSub.oldPath;


        if (errors.length === 0) {
                if (subscription.category.toString() !== category) {
                    Category.findById(category, (err, newCat) => {
                        if (err) {
                            console.log(err);
                            throw new Error('Error retrieving category.');
                        } else {
                            Category.findById(subscription.category, (err, oldCat) => {
                                if (err) {
                                    console.log(err);
                                    throw new Error('Error retrieving category.');
                                }
                                let index = oldCat.subscriptions.findIndex(s => {
                                    return s.toString() === subscription._id.toString();
                                });
                                oldCat.subscriptions.splice(index, 1);
                                oldCat.save((err, oldCat) => {
                                    if (err) {
                                        console.log(err);
                                        throw new Error('Error saving old category.');
                                    } else {
                                        newCat.subscriptions.push(subscription._id);
                                        newCat.save((err, newCat) => {
                                            if (err) {
                                                console.log(err);
                                                throw new Error('Error retrieving new category.');
                                            } else {
                                                subscription.name = name;
                                                subscription.desc = desc;
                                                subscription.imagePath = imagePath;
                                                subscription.url = url;
                                                subscription.category = newCat._id;
                                                subscription.save((err, subscription) => {
                                                    if (err) {
                                                        console.log(err);
                                                        throw new Error('Error saving subscription.');
                                                    } else {
                                                        Category.find({}, null, { sort: { name: 1 } }, (err, categories) => {
                                                            if (err) {
                                                                console.log(err);
                                                                throw new Error('Error retrieving categories.');
                                                            } else {
                                                                if (oldPath) {
                                                                    fs.unlinkSync(oldPath);
                                                                }
                                                                return res.render('add-subscription', {
                                                                    pageTitle: 'Add Subscription',
                                                                    category: subscription.category,
                                                                    isError: false,
                                                                    isSuccess: true,
                                                                    success: 'Subscription updated successfully.',
                                                                    isEdit: true,
                                                                    categories: categories,
                                                                    oldInput: {
                                                                        name: subscription.name,
                                                                        desc: subscription.desc,
                                                                        url: subscription.url,
                                                                        category: subscription.category
                                                                    },
                                                                    id: subscription._id
                                                                });
                                                            }
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    }
                                })
                            })
                        }
                    })
                } else {
                    subscription.name = name;
                    subscription.desc = desc;
                    subscription.imagePath = imagePath;
                    subscription.url = url;
                    subscription.save((err, subscription) => {
                        if (err) {
                            console.log(err);
                            throw new Error('Error saving subscription.');
                        } else {
                            if (oldPath) {
                                fs.unlinkSync(oldPath);
                            }

                            Category.find({}, null, { sort: { name: 1 } }, (err, categories) => {
                                return res.render('add-subscription', {
                                    pageTitle: 'Add Subscription',
                                    category: subscription.category,
                                    isError: false,
                                    isSuccess: true,
                                    success: 'Subscription updated successfully.',
                                    isEdit: true,
                                    categories: categories,
                                    oldInput: {
                                        name: subscription.name,
                                        desc: subscription.desc,
                                        url: subscription.url,
                                        category: subscription.category
                                    },
                                    id: subscription._id
                                });
                            })
                        }
                    });
                }
            } else {
                Category.find({}, null, { sort: { name: 1 } }, (err, categories) => {
                    if (err) {
                        console.log(err);
                        throw new Error('Unable to retrieve categories.');
                    } else {
                        return res.render('add-subscription', {
                            pageTitle: 'Add Subscription',
                            category: subscription.category,
                            isError: true,
                            errors: errors,
                            isSuccess: false,
                            isEdit: true,
                            categories: categories,
                            oldInput: {
                                name: subscription.name,
                                desc: subscription.desc,
                                url: subscription.url,
                                category: subscription.category
                            },
                            id: subscription._id
                        });
                    }
                });
            }    
    }

    Subscription.findById(id, (err, subscription) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving subscription.');
        } else {
            if(!subscription) {
                throw new Error('No subscription found.');
            } else {
                if (req.file) {
                    imagePath = req.file.path;
                    oldPath = subscription.imagePath;
                } else {
                    imagePath = subscription.imagePath;
                }
                
                if(subscription.name !== name || subscription.url !== url) {
                    if(subscription.name !== name && subscription.url !== url) {
                        Subscription.findOne({ name: name }, (err, nameSub) => {
                            if(err) {
                                console.log(err);
                                throw new Error('Error retrieving subscription.');
                            } else {
                                if(nameSub) {
                                    errors.push({
                                        field: 'name',
                                        msg: 'Subscription with that name already exists.'
                                    });
                                }
                                Subscription.findOne({ url: url }, (err, urlSub) => {
                                    if (urlSub) {
                                        errors.push({
                                            field: 'url',
                                            msg: 'Subscription with that url already exists.'
                                        })
                                    }
                                    completePost(subscription, category, {
                                        name: name,
                                        desc: desc,
                                        url: url,
                                        imagePath: imagePath,
                                        oldPath: oldPath
                                    });
                                });
                            }
                        });
                    } else if(subscription.name !== name) {
                        Subscription.findOne({ name: name }, (err, nameSub) => {
                            if(err) {
                                console.log(err);
                                throw new Error('Error retrieving subscription.');
                            } else {
                                if(nameSub) {
                                    errors.push({
                                        field: 'name',
                                        msg: 'Subscription with that name already exists.'
                                    });
                                }
                                completePost(subscription, category, {
                                    name: name,
                                    desc: desc,
                                    url: url,
                                    imagePath: imagePath,
                                    oldPath: oldPath
                                });
                            }
                        })
                    } else if(subscription.url !== url) {
                        Subscription.findOne({ url: url }, (err, urlSub) => {
                            if(err) {
                                console.log(err);
                                throw new Error('Error retrieving subscription.');
                            } else {
                                if(urlSub) {
                                    errors.push({
                                        field: 'url',
                                        msg: 'Subscription with that url already exists.'
                                    });
                                }
                                completePost(subscription, category, {
                                    name: name,
                                    desc: desc,
                                    url: url,
                                    imagePath: imagePath,
                                    oldPath: oldPath
                                });
                            }
                        });
                    }
                } else {
                    completePost(subscription, category, {
                        name: name,
                        desc: desc,
                        url: url,
                        imagePath: imagePath,
                        oldPath: oldPath
                    });
                }
            }
        }
    });
}

exports.postDeleteSubscription = (req, res, next) => {
    let id = req.params.id;

    Subscription.findById(id, (err, subscription) => {
        if(err) {
            console.log(err);
            throw new Error('Error retrieving subscription.');
        } else {
            Category.findById(subscription.category._id, (err, category) => {
                if(err) {
                    console.log(err);
                    throw new Error('Error retrieving category.');
                } else {
                    let index = category.subscriptions.findIndex(s => {
                        return s.toString() === subscription._id.toString();
                    });
                    category.subscriptions.splice(index, 1);
                    category.save( (err, category) => {
                        category.populate('subscriptions', '', null, { sort: { name: 1 } })
                            .execPopulate((err, category) => {
                                if (err) {
                                    console.log(err);
                                    throw new Error('Error retrieving category.');
                                } else {
                                    subscription.remove((err, doc) => {
                                        if (err) {
                                            console.log(err);
                                            throw new Error('Error deleting subscription.');
                                        } else {
                                            fs.unlinkSync(subscription.imagePath);
                                            return res.render('category', {
                                                pageTitle: category.name,
                                                category: category,
                                                isError: false,
                                                isSuccess: true,
                                                success: 'Subscription deleted successfully.'
                                            });
                                        }
                                    });
                                }
                            });
                    });
                }
            });         
        }
    });
}