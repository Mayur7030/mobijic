const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 3000;

app.use(express.json());

// Storage configuration for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Users and files data
const users = [];

// Routes
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    const userExists = users.some((user) => user.username === username);
    if (!userExists) {
      const newUser = { username, password, files: [] };
      users.push(newUser);
      res.json({ message: 'User registered successfully' });
    } else {
      res.status(400).json({ error: 'Username already exists' });
    }
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  const { username } = req.body;
  const user = users.find((u) => u.username === username);
  if (user) {
    const fileId = generateUniqueCode(6);
    user.files.push({ id: fileId, data: req.file.buffer });
    res.json({ message: 'File uploaded successfully', fileId });
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});

app.get('/files/:username', (req, res) => {
  const { username } = req.params;
  const user = users.find((u) => u.username === username);
  if (user) {
    const fileIds = user.files.map((file) => file.id);
    res.json({ fileIds });
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});

app.delete('/remove/:username/:fileId', (req, res) => {
  const { username, fileId } = req.params;
  const user = users.find((u) => u.username === username);
  if (user) {
    const fileIndex = user.files.findIndex((file) => file.id === fileId);
    if (fileIndex !== -1) {
      user.files.splice(fileIndex, 1);
      res.json({ message: 'File removed successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});

app.get('/download/:username/:fileId/:code', (req, res) => {
  const { username, fileId, code } = req.params;
  const user = users.find((u) => u.username === username);
  if (user) {
    const file = user.files.find((f) => f.id === fileId);
    if (file && code === fileId) {
      res.set('Content-Disposition', `attachment; filename=${fileId}`);
      res.send(file.data);
    } else {
      res.status(401).json({ error: 'Invalid code or file not found' });
    }
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Function to generate a unique code
function generateUniqueCode(length) {
  return nanoid(length);
}
