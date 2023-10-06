const express = require('express');
const cors = require('cors');
const User = require('./src/models/User');
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
require('./src/pass-config');
const jwt = require('jsonwebtoken')
const passport = require('passport');
const Task = require('./src/models/Task');

const mongoDB = process.env.MONGO_URL;
const secret = process.env.SECRET;

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log('A pornit serverul');
  mongoose.connect(mongoDB).then(() => {
    console.log('Ne-am conectat la baza de date');
  });
});

app.get('/', (req, res) => {
  res.send('Functioneaza!');
});

app.post('/register', async (req, res) => {
  const { email, pass } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    res.status(401).json({ error: true, message: "Email already registered" });
    return;
  }
  const createdUser = new User({ email, pass });
  createdUser.setPass(pass);
  await createdUser.save();
  res.json(createdUser);
});

app.post('/login', async (req, res) => {
  const { email, pass } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ error: true, message: "Email or pass is wrong" });
  }
  const isSamePass = user.isSamePass(pass);
  if (isSamePass) {
    const userData = {
      id: user.id,
      email: user.email,
      admin: false,

    }

    const token = jwt.sign(userData, secret, { expiresIn: '1h' });
    res.json({
      status: 'success',
      code: 200,
      user: { ...userData, token }
    })
  } else {
    res.status(401).json({ error: true, message: "Email or pass is wrong" });
  }
});

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!user || err) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Unauthorized',
        data: 'Unauthorized',
      })
    }
    req.user = user;
    next();
  })(req, res, next);
}

// de fiecare data cand introducem un nou task, trimitem si id-ul userului
app.post('/tasks', auth, async (req, res, next) => {
  const { text, userId } = req.body;
  const newTask = await Task.create({ text, userId });
  res.json(newTask);
})

// apoi putem sa gasim relatia in functie de ce informatii avem
// daca avem id-ul userului:
// const user = { _id: '123' }
// const userTasks = Task.find({ userId: user._id });
// va returna un array cu toate taskurile acestui user
//
// daca avem taskul si dorim userul care l-a creeat
// const task = { _id: '456', text: 'asdada', userId: '789' }
// const user = User.findById(task.userId);