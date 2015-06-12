var Promise = require('bluebird');
var _ = require('underscore');
var path = require('path');
var config = require('../config');

// Express Framework
var express = require('express');
var consolidate = require('consolidate');
var app = express();
app.config = config;

// Server generated views
var consolidate = require('consolidate');
app.engine('html', consolidate.underscore);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Static Assets
var assetRootDir = path.join(__dirname, '..', 'dist');
app.use(express.static(assetRootDir));

// Routing / Logging
var logger = require('morgan');
if (!config.env.test) app.use(logger('dev'));

// Start the server
var listen = Promise.promisify(app.listen, app);
app.start = listen(config.port).then(function() {
  if (!config.env.test) console.log('Listening on port: ' + config.port);
}, function(err) {
  return console.error('Could not start server:', err);
});

module.exports = app;
