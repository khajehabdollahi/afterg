// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");

const mailer = require("./views/mailer");
const mailerForget = require("./views/mailerForget");

const Friendship = require("./models/friendship");

const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const User = require("./models/user");
const Text = require("./models/text");
const Newschool = require("./models/school");

const MongoDBStore = require("connect-mongo");

const multer = require("multer");

const uuid = require("uuid");

const { storage } = require("./cloudinary/index");
const console = require("console");

const upload = multer({ storage });



const Room = require("./models/room");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const sessionOptions = {
  secret: "secret",
  resave: false,
  saveUninitialized: false,
};

app.use(session(sessionOptions));
app.use(flash());

const dburl = process.env.DB_URL || "mongodb://localhost:27017/backery";



mongoose.connect(dburl, {
  useNewUrlParser: true,
  // useCreateIndex:true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

// const store = MongoDBStore.create({
//   mongoUrl: dbUrl,
//   touchAfter: 24 * 60 * 60,
//   crypto: {
//     secret: "squirrel",
//   },
// });

// store.on("error", function (e) {
//   console.log("Error to save to dataBase", e);
// });


const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const sessionConfig = {
  // store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

app.get("/", (req, res) => {
  res.send("Yes it is going well very well");
});

app.get("/registeraroom", async (req, res) => {
  const room = new Room({ title: "a good room" });
  await room.save();

  res.send(room);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Serving on port 3000");
});
