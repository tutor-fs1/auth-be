const express = require('express');
const cors = require('cors');
const User = require('./src/models/User');
require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
mongoose.Promise = global.Promise;
require('./src/pass-config');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const uploadDir = path.join(process.cwd(), 'temp_files');
const storeImage = path.join(process.cwd(), 'images');

const emailAddress = process.env.EMAIL;
const emailPass = process.env.PASS;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.toLowerCase().split(' ').join('-'));
  },
  limits: {
    fileSize: 1048576,
  },
});


const upload = multer({
  storage: storage,
});




const Task = require('./src/models/Task');

const mongoDB = process.env.MONGO_URL;
const secret = process.env.SECRET;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log('A pornit serverul');
  mongoose.connect(mongoDB).then(() => {
    console.log('Ne-am conectat la baza de date');
  });
});

// app.post('/upload', upload.single('numeinput'), async (req, res, next) => {
//   const { nume } = req.body;
//   const { path: temporaryName, originalname } = req.file;
//   // res.json({ temporaryName, originalname });
//   // console.log()
//   // const fileName = path.join(storeImage, originalname);
//   // try {
//   //   await fs.rename(temporaryName, fileName);
//   // } catch (err) {
//   //   await fs.unlink(temporaryName);
//   //   return next(err);
//   // }
//   // res.json({ description, message: 'Fișierul a fost încărcat cu succes', status: 200 });
// });

app.get('/', (req, res) => {
  res.send('Functioneaza!');
});

app.get('/testemail', (req, res) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailAddress,
      pass: emailPass
    }
  });

  const mailOptions = {
    from: emailAddress,
    to: 'andrei.kantor@gmail.com',
    subject: 'Testam emailul',
    text: 'Dudes, we really need your money.'
  };

  // transporter.sendMail(mailOptions, function (error, info) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Email sent: ' + info.response);
  //   }
  // });



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
app.get('/tasks', auth, async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post('/tasks', [auth, upload.single('taskImage')], async (req, res) => {
  const { text, userId } = req.body;
  const newTask = await Task.create({ text, userId });
  console.log(newTask._id);
  // const newFileName = 
  if (!req.file) {
    return res.json(newTask);
  }
  const { path: temporaryName, originalname } = req.file;
  // din string fac array despartit de puncte
  let numeOriginalFaraExtensie = originalname.split('.');
  // sterg ultimul item din array (adica extensia fisierului)
  numeOriginalFaraExtensie.pop();
  // fac aceleasi transformari ale stringului ca in configuratia multer de mai sus
  numeOriginalFaraExtensie = numeOriginalFaraExtensie.join('.').toLowerCase().split(' ').join('-');
  const numeNou = temporaryName.replace(numeOriginalFaraExtensie, newTask._id);
  await fs.rename(temporaryName, numeNou);
  newTask.image = numeNou;
  await newTask.save();
  return res.json(newTask);
  // return res.json({...newTask,});
  // res.json({ numeNou });

  // if (temporaryName) {
  //   return res.json({ 'message': 'are imagine' });
  // } else {
  //   return res.json({ 'message': 'NU are imagine' });
  // }
  // const newTask = await Task.create({ text, userId });
  // res.json(newTask);
});

// app.post('/upload', upload.single('numeinput'), async (req, res, next) => {
//   const { nume } = req.body;
//   const { path: temporaryName, originalname } = req.file;

app.delete('/tasks/:taskId', auth, async (req, res) => {
  const { taskId } = req.params;
  const deletedTask = await Task.deleteOne({ _id: taskId })
  // const newTask = await Task.create({ text, userId });
  res.json({ 'message': 'deleted' });
});

// apoi putem sa gasim relatia in functie de ce informatii avem
// daca avem id-ul userului:
// const user = { _id: '123' }
// const userTasks = Task.find({ userId: user._id });
// va returna un array cu toate taskurile acestui user
//
// daca avem taskul si dorim userul care l-a creeat
// const task = { _id: '456', text: 'asdada', userId: '789' }
// const user = User.findById(task.userId);