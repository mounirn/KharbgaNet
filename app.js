//const createError = require('http-errors');
//var express = require('express');
const path = require('path');
// const cookieParser = require('cookie-parser');
// const logger = require('morgan');

const express = require('express');
const app = express();
const port = 3002;

app.use(express.static('www'));

app.use('/home', express.static('www'));

app.use('/welcome', express.static(path.join(__dirname, 'www')));

app.get('/', (req, res) => {
  res.send('Hello World - Express.JS!');
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});