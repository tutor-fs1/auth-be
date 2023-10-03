const express = require('express');
const cors = require('cors');
const User = require('./src/models/User');
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
require('./src/pass-config');
const jwt = require('jsonwebtoken')
const passport = require('passport');

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
  const createdUser = new User({ email, pass });
  createdUser.setPass(pass);
  await createdUser.save();
  res.json(createdUser);
});

app.post('/login', async (req, res) => {
  const { email, pass } = req.body;
  const user = await User.findOne({ email });
  const isSamePass = user.isSamePass(pass);
  if (isSamePass) {
    const payload = {
      id: user.id,
      email: user.email,
      admin: false
    }

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    res.json({
      status: 'success',
      code: 200,
      data: {
        token,
      },
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


app.get('/tasks', auth, (req, res, next) => {
  const { username } = req.user;
  res.json({
    status: 'success',
    code: 200,
    data: {
      message: `Authorization was successful: ${username}`,
    },
  })
})