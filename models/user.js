const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const jwt = require('jsonwebtoken')

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: String,
  name: {
    type: String,
    required: true,
  },
  schoolPhoneNumber: {
    type: Number,
  },
  activated: {
    type: Boolean,
  },
  confirmation: {
    type: Boolean,
  },
  tokens: [
    {
      token: String,
    },
  ],
});


userSchema.methods.Authuser = async function(){
  const token = jwt.sign({_id : this.id} , 'mysupersecret')
  this.tokens = this.tokens.concat({token : token})
  await this.save()
  return token;
}


userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
