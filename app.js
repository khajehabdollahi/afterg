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

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  next();
});

app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use("/public", express.static("public"));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.send("Yes it is going well very well");
});


const requiredLogin = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  next();
};

app.get("/secret", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  res.render("secret");
});

app.get("/newones", requiredLogin, async (req, res) => {
  const id = req.user.id;
  const school = await Newschool.findOne({ "creator.id": id });

  if (school) {
    res.send("You have already registered a school");
  } else {
    res.render("newone");
  }
});

app.post("/news", upload.single("image"), async (req, res) => {
  // console.log(req.schoolody, req.file)
  const input = req.body;
  const school = new Newschool(input);
  school.schoolsname = req.body.schoolsname.toLowerCase();
  school.city = req.body.city.toLowerCase();
  school.provience = req.body.provience.toLowerCase();
  school.district = req.body.district.toLowerCase();
  school.Street = req.body.Street.toLowerCase();
  school.line = req.body.line.toLowerCase();
  school.creator.username = req.user.username;
  school.creator.name = req.user.name;
  school.creator.id = req.user.id;

  await school.save();

  res.redirect("/");
});


app.put("/news/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const cuId = req.user.id;
  const data = req.body;

  school = await Newschool.findByIdAndUpdate(id, data);
  school.image = req.file.path;
  school.save();
  res.redirect("/news/" + id + "/" + cuId);
});

app.get("/news/:id", async (req, res) => {
  const { id } = req.params;
  //finding the school
  const school = await Newschool.findById(id);

  const schoolCretorId = school.creator.id;
  const schoolCreatorUser = await User.findById(schoolCretorId);

  // Finding if there is a friendship with this school Id
  const friendships = await Friendship.find({ schoolId: id });
  const userId = friendships.friendRequesterID;
  const user = await User.findById(userId);

  // Finding users who sent friendship to
  const uId = friendships.friendrequesterId;
  //finding all friendsships
  const allFriendships = await Friendship.find({});

  let friendRequesterID = undefined;
  for (let f of allFriendships) {
    if (req.user) {
      if (req.user.id === f.friendrequesterId) {
        friendRequesterID = f.friendrequesterId;
      } else {
        friendRequesterID = undefined;
      }
    }
  }

  const schoolFriend = await Newschool.findOne({ "creator.id": uId });

  res.render("schoolDetail", {
    school,
    friendships,
    schoolFriend,
    uId,
    allFriendships,
    friendRequesterID,
    schoolCreatorUser,
  });
});

app.get("/news/:id/edit", requiredLogin, async (req, res) => {
  const { id } = req.params;

  const school = await Newschool.findById(id);
  res.render("edit", { school });
});



app.use((req, res) => {
  res.status(404).send(`<h1>The page is not defined</h1>`);
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`School SERVER RUNNING! on ${port}`);
});
