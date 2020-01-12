const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    imagePath: {
        type: String,
        required: true
    },

    desc: {
        type: String,
        required: true
    },

    url: {
        type: String,
        required: true
    },

    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);