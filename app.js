const express = require('express')
const path = require("path");
const mongoose = require("mongoose");
const session = require('express-session')
const flash=require('connect-flash')

const Room= require('./models/room')



const app = express()


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
const sessionOptions = {
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}

app.use(session(sessionOptions));
app.use(flash())

const MongoDBStore = require("connect-mongo")

mongoose.connect("mongodb://localhost:27017/room", {
  useNewUrlParser: true,
  // useCreateIndex:true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});



app.get('/', (req, res) => {
  res.render('home')
})

app.get('/registeraroom',async (req, res) => {
  const room = new Room({ title: 'a good room', })
  await room.save()

  res.send(room)
})

app.listen(3000, () => {
  console.log('Serving on port 3000')
})