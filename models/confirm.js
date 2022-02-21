const mongoose = require("mongoose");

const confirmSchema = new mongoose.Schema({
  //The Id of the school which receives confirm request
  confirmRequesterUserId: {
    type: String,
  },
  confirmRequesterUser: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  confirmRequestersName: {
    type: String,
  },

  confirmRequestedToUser: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  text: {
    type: String,
  },
  confirmation: {
    type: String,
    default: "Waiting for confirmation",
  },

  date: {
    type: String,
  },
});

const Confirm = mongoose.model("Confirm", confirmSchema);

module.exports = Confirm;

