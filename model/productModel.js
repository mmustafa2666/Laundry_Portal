const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    image: Buffer,
    name:String,
    price: Number,
    discount: {
        type: Number,
        default: 0 ,
    },
    bgcolor: {
        length: 7 ,
        type: String,
    },
    panelcolor: {
        length: 7 ,
        type: String,
    },
    textcolor: {
        length: 7 ,
        type: String,
    },
});

module.exports = mongoose.model("product", productSchema);