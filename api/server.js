const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const config = require('config');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/error-handler');
const usersController = require('./user.controller');
const postsController = require('./post.controller');

const app = express();
const httpServer = http.createServer(app);
let httpsServer;

if (config.environment === 'production') {
  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/hudsonotron.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/hudsonotron.com/fullchain.pem'),
  };
  httpsServer = https.createServer(options, app);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use('/users', usersController);
app.use('/posts', postsController);
app.use(errorHandler);

httpServer.listen(3000, () => {
  console.log('listening to http on port 3000');
});
if (config.environment === 'production') {
  httpsServer.listen(3001, () => {
    console.log('listening to https on port 3001...');
  });
}

module.exports = app;
