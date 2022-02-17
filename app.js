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

const dburl = process.env.DB_URL || "mongodb://localhost:27017/school";



mongoose.connect(dburl, {
  useNewUrlParser: true,
  // useCreateIndex:true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected yes is connected");
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






app.get("/news/:id/addimage", requiredLogin, async (req, res) => {
  const { id } = req.params;
  const school = await Newschool.findById(id);
  res.render("addimage", { school });
});

app.get("/deleteconfirm/:id", async (req, res) => {
  const { id } = req.params;
  const school = await Newschool.findById(id);
  res.render("schoolDelete", { id, school });
});

app.delete("/deleteschool/:id", async (req, res) => {
  const { id } = req.params;

  //  await Friendship.findAndDelete({ schoolId: id });
  //  await Friendship.findAndDelete({
  //    friendshipRequesterSchoolId: id,
  //  });

  await Newschool.findByIdAndDelete(id);
  //  req.flash("mes", "Yes deleted a backery");
  res.redirect("/");
});

app.get("/schools", requiredLogin, async (req, res) => {
  const currentUserId = req.user.id;
  const currenUsersSchool = await Newschool.findOne({
    "creator.id": currentUserId,
  });

  if (!currenUsersSchool) {
    const schools = await Newschool.find({});

    schools.sort(function (a, b) {
      var nameA = a.schoolsname.toUpperCase();
      var nameB = b.schoolsname.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    res.render("allschools1", { schools, currentUserId, currenUsersSchool });
  }
  const schools = await Newschool.find({});

  schools.sort(function (a, b) {
    var nameA = a.schoolsname.toUpperCase();
    var nameB = b.schoolsname.toUpperCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  res.render("allschools", { schools, currentUserId });
});

app.get("/news/:sid/:cuid", async (req, res) => {
  //sid is the Id of this school
  const sid = req.params.sid;
  //cuid is the id of current user
  const cuid = req.params.cuid;
  //finding the school
  const school = await Newschool.findById(sid);

  const schoolCretorId = school.creator.id;
  const schoolCreatorUser = await User.findById(schoolCretorId);

  // Finding if there is a friendship which is sent  to this school
  const recivedFriendship = await Friendship.find({ schoolId: sid });

  //finding the user who created this schoolId
  // const schoolCreatorUser = await User.findById({ "school.creator.id": sid });
  // res.send(schoolCreatorUser)
  const user = school.creator;
  const schoolCreatorId = user.id;

  const friendshipReqestSent = await Friendship.find({
    friendrequesterid: schoolCreatorId,
  });

  //Finding the School which is created by Current User
  const schoolFriend = await Newschool.findOne({ "creator.id": cuid });

  //Finding friendships which is sent to current user
  const friendships = await Friendship.find({ schoolId: schoolFriend.id });

  //finding all friendships
  const allFriendships = await Friendship.find({});
  let youAreAlreadyFriends = undefined;
  let ifYouAreAlreadyFriends = "No";
  let isFriendshipRequestSent = undefined;
  for (let friend of allFriendships) {
    if (friend.schoolId == sid && friend.friendrequesterid == cuid) {
      isFriendshipRequestSent = "Yes";
      if (friend.confirmation == "Yes") {
        ifYouAreAlreadyFriends = "Yes";
        break;
      }
    }
  }

  let youHaveAlreadySentFrienshipRequest = undefined;
  let haveYoureceivedFriendRequsestFromThisSchoolNotConfirmed = "No";

  let shFriendship = school.frienship;

  let haveYoureceivedFriendRequsestFromThisSchool = undefined;

  for (let friend of allFriendships) {
    if (
      friend.friendrequesterid == schoolCretorId &&
      friend.schoolId === schoolFriend.id &&
      friend.confirmation == "Yes"
    ) {
      haveYoureceivedFriendRequsestFromThisSchool = "Yes";
    }
  }

  let areYouAlreadyFriend = "No";
  for (let friend of allFriendships) {
    if (
      friend.friendrequesterid === sid &&
      friend.schoolId === schoolFriend.id &&
      friend.confirmation == "Yes"
    ) {
      areYouAlreadyFriend = "Yes";
    }
  }

  for (let friend of allFriendships) {
    if (
      friend.userIdWhichReceivedFriendshipRequest == cuid &&
      friend.friendshipRequesterSchoolId == sid &&
      friend.confirmation == "Waiting for confirmation"
    ) {
      haveYoureceivedFriendRequsestFromThisSchoolNotConfirmed = "Yes";
    }
  }

  res.render("schoolNewDetail", {
    school,
    friendships,
    recivedFriendship,
    friendshipReqestSent,
    allFriendships,
    isFriendshipRequestSent,
    areYouAlreadyFriend,
    youHaveAlreadySentFrienshipRequest,
    youAreAlreadyFriends,
    ifYouAreAlreadyFriends,
    haveYoureceivedFriendRequsestFromThisSchool,
    haveYoureceivedFriendRequsestFromThisSchoolNotConfirmed,
    schoolCreatorUser,
  });
});

app.put("/schoolimagedelete/:id", async (req, res) => {
  const { id } = req.params;

  console.log("DELETE");
  const school = await Newschool.findByIdAndUpdate(id, { image: "" });
  school.save();

  res.render("home");
});

app.get("/", (req, res) => {
  res.render("home");
});



app.get("/userconfirm/:uid/:sid", async (req, res) => {
  const { uid } = req.params;
  const { sid } = req.params;

  const confirmRequsteduser = await User.findById(uid);

  const confirmRequstTouser = await User.findById(sid);

  const confirm = new Confirm();
  confirm.confirmRequestedToUser.id = sid;
  confirm.confirmRequesterUserId = sid;
  confirm.confirmRequesterUser.id = uid;
  confirm.confirmRequestersName = confirmRequsteduser.name;
  confirm.save();

  res.render("userconfirm1", { confirm, uid, sid, confirmRequstTouser });
});

app.post("/userconfirm/:id", async (req, res) => {
  const { id } = req.params;

  const confirm = await Confirm.findById(id);
  confirm.text = req.body.text;
  confirm.save();

  res.redirect("/");
});

const isValidData = (str) => {
  var re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
  return re.test(str);
};

//REGISTER USER
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  let username = req.body.username;

  let name = req.body.name;
  let schoolPhoneNumber = req.body.schoolPhoneNumber;
  let inputPassword = req.body.password;

  if (!isValidData(inputPassword)) {
    res.render("invalidpass");
  } else {
    password = inputPassword;
  }

  const newUser = new User({
    username,
    name,
    schoolPhoneNumber,
    activated: false,
  });

  let user = await User.findOne({ username: username });
  const err = "User with the Email already exist!";
  if (user) {
    res.render("registererror", { err });
  } else {
    await User.register(newUser, password);
  }

  let { id } = await User.findOne({ username: username });
  mailer(
    username,
    "Welcome to web",
    "Yes you are very welcome now \n please activate ur account by clicking this link\n \n http://localhost:3000/activate/" +
      id
  ); //Detta lokal host ska ändras till domänen
  res.render("registerSuccess", { newUser });
});

app.get("/activate/:id", async (req, res) => {
  let user = await User.findOne({ _id: req.params.id });
  if (user) {
    user.activated = true;
    await user.save();
    // // res.send("Account is activated now");
    // res.redirect("http://localhost:3000/welcomeuser?id=" + req.params.id).end();
    res.render("loginWelcome", { user });
  } else {
    res.send("Activation Failed");
  }
});

app.get("/users/edit/:id", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  res.render("edituser", { user });
});

app.put("/users/edit/:id", async (req, res) => {
  const { id } = await req.params;
  console.log("id: ");

  const user = await User.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true,
  });
  user.save();
  res.redirect("/users/" + id);
});

app.get("/deleteuser/:id", async (req, res) => {
  const { id } = await req.params;
  const user = await User.findById(id);
  res.render("deleteAccountconfirmation", { user });
});
app.get("/deleteuserconfirm/:id", async (req, res) => {
  const { id } = req.params;
  await Newschool.findOneAndDelete({ "creator.id": id });

  await Friendship.deleteMany({
    friendrequesterid: id,
  });
  await Friendship.deleteMany({
    userIdWhichReceivedFriendshipRequest: id,
  });
  // const text = await Text.findAndDelete({ "author.id": id });
  await User.findByIdAndDelete(id);
  res.redirect("/");
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  await passport.authenticate("local", (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user.username) {
      const worngUser = req.body.username;
      return res.render("wrongEmail", { worngUser });
    }
    if (!user) {
      const worngUser = req.body.username;
      return res.render("wrongpassword", { worngUser });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect("/schools");
    });
  })(req, res, next);
});

app.get("/forgetpass", (req, res) => {
  let tempid = uuid.v4();
  res.render("foreget", { tempid });
});

app.post("/forgetpass/:tempid", async (req, res) => {
  const { tempid } = await req.params;
  const { username } = req.body;
  let user1 = await User.findOne({ username: username });
  if (!user1) {
    res.render("nouser", { username });
  } else {
    const user = await User.find({ username }, function (err, user) {
      if (err) {
        console.log(err);
      } else {
        mailerForget(
          username,
          "Hve you forgatten your pass",
          " please on the bellow link to reset your password\n \n (http://localhost:3000/resetpass/" +
            tempid +
            "/" +
            username
        );
        res.redirect("/");
      }
    });
  }
});

//RESET PASSWORD
app.get("/resetpass/:tempid/:username", async (req, res) => {
  const { tempid } = await req.params;
  const { username } = await req.params;
  res.render("resetpass", { tempid, username });
});

app.put("/resetpass/:tempid/:username", async (req, res) => {
  const { username } = req.body;
  console.log(username.substring(username.indexOf("/") + 1));
  const { password } = req.body;

  await User.findOne({ username }, (err, user) => {
    if (err) {
      res.send("Password reset Failed");
    } else {
      console.log("USER:", user);
      user.setPassword(password, (error, returnedUser) => {
        if (error) {
          console.log(error);
        } else {
          returnedUser.save();
        }
      });
      res.send(username);
    }
  });
});

app.get("/writenewtext", requiredLogin, (req, res) => {
  res.render("text");
});

app.post("/dialogue", requiredLogin, async (req, res) => {
  const text = new Text(req.body);
  const id = req.user.id;
  const auth = await User.findById(id);
  text.author.name = auth.name;
  text.author.id = auth.id;
  text.save();
  const allText = await Text.find({});
  res.redirect("/alldialogues");
});

app.get("/alldialogues", requiredLogin, async (req, res) => {
  const id = req.user.id;

  const allText = await Text.find({});
  res.render("dialogue", { allText, id });
});
app.get("/text/:id", async (req, res) => {
  const { id } = req.params;
  const text = await Text.findById(id);
  res.render("everytext", { text });
});

app.get("/edittext/:id", async (req, res) => {
  const { id } = req.params;

  const text = await Text.findById(id);
  res.render("textedit", { text });
});

app.get("/deletetext/:id", async (req, res) => {
  const { id } = req.params;
  const text = await Text.findById(id);
  res.render("deletetextconfirm", { text });
});
app.get("/deletetextconfirm/:id", async (req, res) => {
  const { id } = req.params;
  const text = await Text.findByIdAndDelete(id);
  res.redirect("/alldialogues");
});

app.put("/dialogue/:id", async (req, res) => {
  const { id } = req.params;
  const text = await Text.findByIdAndUpdate(id, req.body, {
    runValidators: true,
  });
  res.redirect("/alldialogues");
});

app.get("/users", async (req, res) => {
  const allUsers = await User.find({});
  res.render("allUsers", { allUsers });
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  const school = await Newschool.findOne({ "creator.id": id });

  const text = await Text.find({ "author.id": id });
  const confirm = await Confirm.find({ "confirmRequestedToUser.id": id });

  res.render("showuser", { user, school, text, confirm });
});
app.get("/finalconfirm/:id/:uid/:cid", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.params;
  const { cid } = req.params;
  const requesterUser = await User.findById(id);
  const requestedToUser = await User.findById(uid);
  const school = await Newschool.findOne({ "creator.id": id });
  res.render("finalconfirm", { requesterUser, requestedToUser, school, cid });
});

app.post("/finalconfirm/:id/:cid", async (req, res) => {
  const { id } = req.params;
  const { cid } = req.params;
  const confirm = await Confirm.findById(cid);

  confirm.confirmation = req.body.confirmation;

  const user = await User.findById(id);

  user.confirmation = req.body.confirmation;
  confirm.save();
  user.save();
  res.redirect("/");
});

app.put("/userconfirm/:id", async (req, res) => {
  const { id } = req.params;
  const confirmation = req.body.confirmation;

  const confirm = await Confirm.findById(id);
  confirm.confirmation = confirmation;
  confirm.save();
  res.redirect("/");
});

app.get("/requestfriendship/:id", requiredLogin, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const school = await Newschool.findById(id);
  res.render("friendship", { id, school });
});

app.post("/friend/:id", async (req, res) => {
  const friended = new Friendship(req.body);
  const id = req.params.id;
  //finding the school which receive friendship request
  const school = await Newschool.findById(id);
  const uId = req.body.friendrequesterid;

  //finding the school which send friendship
  const fschool = await Newschool.findOne({ "creator.id": uId });

  const friendshipRequesterSchoolId = fschool.id;
  const userIdWhichReceivedFriendshipRequest = school.creator.id;

  // let newfriend = school.frienship;
  friended.friendshipRequestersSchoolsName = fschool.schoolsname;
  friended.userIdWhichReceivedFriendshipRequest =
    userIdWhichReceivedFriendshipRequest;
  friended.friendshipRequesterSchoolId = fschool.id;
  // friended.friendrequesterid = req.body.friendrequesterid;
  school.frienship.push(friendshipRequesterSchoolId);
  const date = Date.now();
  friended.date = date.toString();
  school.save();

  friended.save();

  res.redirect("/news/" + id + "/" + uId);
});

app.get("/users/:username", async (req, res) => {
  const { username } = req.params;
  const user = await User.findById(username);
  res.render("showuser", { user });
});

app.get("/friendshipconfirm/:fid/:id", async (req, res) => {
  const { fid } = req.params;
  const { id } = req.params;

  const friendship = await Friendship.findById(fid);

  const uid = friendship.friendrequesterid;

  const fschool = await Newschool.findOne({ "creator.id": uid });

  const school = await Newschool.findById(id);

  res.render("friendshipconfirm", { friendship, school, fschool });
});

app.put("/friendshipconfirm/:id", async (req, res) => {
  const { id } = req.params;
  const confirmation = req.body.confirmation;

  const friendship = await Friendship.findByIdAndUpdate(id);

  friendship.confirmation = confirmation;

  friendship.save();
  res.redirect("/schools");
});

app.get("/friendship", async (req, res) => {
  const friendship = await Friendship.find({});
  res.render("friendships", { friendship });
});

app.get("/users/:id/:uid/school", async (req, res) => {
  const { id } = req.params;
  const uid = req.params;
  const user = await User.findById(id);
  const school = await Newschool.findOne({ "creator.id": id });
  const schoolId = school.id;
  res.render("school", { school });
});

app.get("/search", requiredLogin, (req, res) => {
  res.render("search");
});
app.get("/search/schoolname", (req, res) => {
  res.render("searchschoolname");
});

app.post("/search/schoolname", async (req, res) => {
  const input = req.body.schoolsname;
  const search = input.toLowerCase();
  const school = await Newschool.find({ schoolsname: search });
  res.render("resultp", { school });
});

app.get("/search/provience", (req, res) => {
  res.render("searchp");
});

app.post("/search/provience", async (req, res) => {
  const input = req.body.provience;
  const search = input.toLowerCase();
  let query = {
    $or: [{ provience: search }, { city: search }, { district: search }],
  };

  const school = await Newschool.find(query);
  res.render("resultp", { school });
});

app.get("/search/gender", (req, res) => {
  res.render("gender");
});

app.post("/search/gender", async (req, res) => {
  const input = req.body.searchKey;
  const search = input.toLowerCase();
  let query = {
    $or: [{ gender: search }],
  };

  const school = await Newschool.find(query);
  res.render("resultp", { school });
});

app.get("/search/village", (req, res) => {
  res.render("searchv");
});
app.post("/search/village", async (req, res) => {
  const input = req.body.vi;
  const search = input.toLowerCase();
  let query = {
    $or: [{ village: search }],
  };

  const school = await Newschool.find(query);
  res.render("resultP", { school });
});

app.get("/search/street", (req, res) => {
  res.render("searchStLn");
});
app.post("/search/street", async (req, res) => {
  const input = req.body.searchKey;
  const search = input.toLowerCase();

  let query = {
    $or: [{ Street: search }, { line: search }],
  };

  const school = await Newschool.find(query);
  res.render("resultp", { school });
});

app.get("/search/mobilenumber", (req, res) => {
  res.render("searchMnPc");
});

app.post("/search/mobilenumber", async (req, res) => {
  const input = req.body.searchKey;
  let query = {
    $or: [{ mobileNumber: input }, { postCode: input }],
  };

  const school = await Newschool.find(query);
  res.render("resultp", { school });
});

app.get("/search/economylevel", (req, res) => {
  res.render("searchel");
});

app.post("/search/economylevel", async (req, res) => {
  const input = req.body.searchKey;
  const school = await Newschool.find()
    .where("averageMonthlyIncomPerPerson")
    .lte(input)
    .exec();
  res.render("resultp", { school });
});

app.post("/api/login", async (req, res, next) => {
  await passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send("Username or Password incorrect!");
    } else if (!user.activated) {
      return res.status(404).send("User is not Activated, pls Activate!");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res
        .status(200)
        .send({ id: user._id, username: user.username, role: user.role });
    });
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});




app.use((req, res) => {
  res.status(404).send(`<h1>The page is not defined</h1>`);
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`School SERVER RUNNING! on ${port}`);
});
