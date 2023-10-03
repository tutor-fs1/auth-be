const mongoose = require("mongoose");
const bCrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const user = Schema({
  email: {
    type: String,
    required: [true, "Email required"],
    unique: true
  },
  pass: {
    type: String,
    required: [true, "Password required"]
  }
}, { versionKey: false, timestamps: true }
);

user.methods.setPass = function (pass) {
  this.pass = bCrypt.hashSync(pass, bCrypt.genSaltSync(6));
};

user.methods.isSamePass = function (pass) {
  return bCrypt.compareSync(pass, this.pass);
};

const User = mongoose.model("user", user);
module.exports = User;
