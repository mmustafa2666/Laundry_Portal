// models/usermodel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const adminSchema = new mongoose.Schema({
  fullname: {
    type: String,
    minLenght: 3,
    trim: true
  },
  email: { type: String, unique: true },
  number: String,
  password: String,
  otp: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Posts', // Assuming you have a Post model for user's posts
    }
  ],
  profileimage: Buffer,
});

adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

adminSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;