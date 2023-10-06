const mongoose = require("mongoose");
const bCrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const task = Schema({
  text: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, { versionKey: false, timestamps: true }
);


const Task = mongoose.model("task", task);
module.exports = Task;
