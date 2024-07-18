const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const productModel = require('../model/productModel')

router.post("/create", upload.single('image'), async function (req, res) {
    try{
        let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
    let product = await productModel.create({
        image: req.file.buffer,
        name,
        price,
        discount,
        bgcolor,
        panelcolor,
        textcolor
    })
    res.redirect("/owners/createproduct");
    }catch (err){
        res.redirect('owners/admin');
    }
});




module.exports = router;