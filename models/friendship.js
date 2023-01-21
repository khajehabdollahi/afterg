const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema({
  //the Id of the school which send friendship request
  friendshipRequesterSchoolId: {
    type: String,
  },
  //the Id of the school which receive friendship request
  schoolId: {
    type: String,
  },
  confirmation: {
    type: String,
    default: "Waiting for confirmation",
  },
  friendrequestersname: {
    type: String,
  },
  friendrequesteedtoname: {
    type: String,
  },
});

const Friendship = mongoose.model("Friendship", friendshipSchema);

module.exports = Friendship;
