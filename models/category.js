const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },

    subscriptions: [{
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    }]
});

module.exports = mongoose.model('Category', categorySchema);