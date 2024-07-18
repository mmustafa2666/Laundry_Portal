const mongoose = require('mongoose');


const MONGOURL = 'mongodb://127.0.0.1:27017/lorbacked';

mongoose.connect(MONGOURL)
.then(()=>{
    console.log('Connected')
}).catch((err)=>{
    console.log(err)
})

module.exports = mongoose.connection;