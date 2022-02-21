const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

var userSchema = new mongoose.Schema({
    username: {
      type: String,
      unique: true,
      required: true,
      minLength: 3,
      maxLength: 25,
    },
    avatar: {
      type: String,
      default: '',
    },
    email: {
        type: String,
        required: false,
        minLength: 6,
        maxLength: 150,
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    name: {
      type: String,
    },
    company: {
      name: {
        type: String,
      }
    },
    contact: {
      phone: {
        type: String,
        match: /[\-0-9 ]/,
      },
      wechat: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      default: 'zh',
      required: true,
      enum: ['zh', 'en'],
    },
    roles: [{
      type: String,
      default: 'basic',
    }],
    password_hash: { type: String, required: true },
    seller: {
      type: ObjectId,
      ref: 'User',
      description: 'In case of customer user - the seller that deals with this customer',
    },
    flags: {
      hasContent: { type: Boolean, default: false }
    },
    lastLogIn: { type: Date }
});

userSchema.pre('save', function(){
  this.lastLogIn = null;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
