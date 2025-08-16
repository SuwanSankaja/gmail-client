
const express = require('express');

require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;


app.get('/', (req, res) => {
  res.send('Hello from the Gmail API Backend!');
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
