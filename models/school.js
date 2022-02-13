const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  schoolsname: {
    type: String,
    required: true,
  },

  numberOfStudents: {
    type: Number,
    required: true,
  },
  averageMonthlyIncomPerPerson: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  provience: {
    type: String,
  },
  city: {
    type: String,
  },
  district: {
    type: String,
  },
  village: {
    type: String,
  },
  Street: {
    type: String,
  },
  line: {
    type: String,
  },
  number: {
    type: String,
  },
  postCode: {
    type: String,
  },
  mobileNumber: {
    type: Number,
  },
  location: {
    type: String,
  },
  frienship: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Friendship",
    },
  ],
  creator: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
  },
});

const Newschool = mongoose.model("School", schoolSchema);

module.exports = Newschool;
