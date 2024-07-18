const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fullname: {
    type: String,
    required: true
},
contact: {
    type: Number,
    required: true
},
email: {
    type: String,
    required: true
},
items: [{
    item: {
        type: String,
        required: true,
        enum: ["shalwar", "kameez", "tshirt", "jeans", "2-piece", "3-piece", "hand towel"]
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalprice: {
        type: Number,
        required: true
    }
}],
address: {
    type: String,
    required: true
},
grandTotal: {
    type: Array,
    required: true
},
createdAt: {
    type: Date,
    default: Date.now
},
  isCompleted: {
    type: Boolean,
    default: false,
  }
});

// Create the order model
module.exports = mongoose.model('Order', orderSchema);
