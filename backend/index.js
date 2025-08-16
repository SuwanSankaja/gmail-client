
const express = require('express');

require('dotenv').config();

const { sequelize } = require('./models');
const app = express();

const PORT = process.env.PORT || 5000;


app.get('/', (req, res) => {
  res.send('Hello from the Gmail API Backend!');
});

async function testDbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await testDbConnection();
});
