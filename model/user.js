// models/usermodel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  googleId: String,
  fullname: {
    type: String,
    minLenght: 3,
    trim: true
  },
  email: { type: String, unique: true },
  number: String,
  password: String,
  otp: String,
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order', // Assuming you have a Post model for user's posts
    }
  ],
  isVerified: { type: Boolean, default: false },
  image: {
      type: Buffer,
      default: 'https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png' // Set the default image URL
  },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;
