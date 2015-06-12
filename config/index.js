var _ = require('underscore');
var yaml = require('js-yaml');
var fs = require('fs');
var Environment = require('./environment');
var merge = require('../util/object').merge;

// Set the environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var env = new Environment(process.env.NODE_ENV);

// Parse the config file
var configFile = yaml.load(fs.readFileSync(__dirname + '/config.template.yml','utf-8'));
try {
  var overrides = yaml.load(fs.readFileSync(__dirname + '/config.yml','utf-8'));
  configFile = merge(configFile, overrides);
} catch (e) {}

// Load the config
var config = configFile[env];
config.env = env;
config.numWorkers = config.numWorkers || 1;

// Parse out the URL's parts
var parseUrl = require('url').parse;
config.url = parseUrl(config.uri);

module.exports = config;
