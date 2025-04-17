//require('dotenv').config(); // for local testing

const express = require('express');
const serverless = require('serverless-http');
const admin = require('firebase-admin');

const app = express();
const router = express.Router();

app.use(express.json()); // Middleware to parse JSON

// 🔐 Parse Firebase service account from env
const rawServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
rawServiceAccount.private_key = rawServiceAccount.private_key.replace(/\\n/g, '\n');


  admin.initializeApp({
    credential: admin.credential.cert(rawServiceAccount),
    databaseURL: "https://nodejsapp-6a41d-default-rtdb.firebaseio.com" 
  });


const db = admin.database();

// GET /api/hello
router.get('/hello', async (req, res) => {
    const myName = process.env.MY_NAME || 'World';
  const ref = db.ref('test/greeting');
  await ref.set({ message: 'Hello from '+myName+'!' });
  const snapshot = await ref.once('value');
  res.json({ data: snapshot.val() });
});

router.get('/saveMovie', async (req, res) => {
  const movieName = 'Interstellar'
const ref = db.ref('movieslist');

const obj = {
  name: movieName,
  createdAt: Date.now(),
}
await ref.set(obj);
const snapshot = await ref.once('value');
res.json({ data: snapshot.val() });
});

// POST /api/message
router.post('/message', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const newRef = db.ref('messages').push();
  await newRef.set({ message, createdAt: Date.now() });

  res.status(201).json({ id: newRef.key });
});

// GET /api/messages
router.get('/messages', async (req, res) => {
  const snapshot = await db.ref('messages').once('value');
  res.json(snapshot.val());
});

app.use('/api', router);

module.exports.handler = serverless(app);
