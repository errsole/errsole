'use strict'

var Hook = require('./hooks');
var EventCapture = require('./eventCapture');
var ForksManager = require('./forksManager');
var Server = require('./connection/server');
var appConfig = require('../config');


var Main = {};

Main.initialize = function(options) {
  var token = options.token;
  if(!token || token == '') {
    throw new Error('App token is missing in the initialize function arguments. For more information, visit our documentation page at https://errsole.com/documentation');
  }

  Hook.initialize();
  EventCapture.initialize();

  process.nextTick(function() {
    ForksManager.initialize();
    Server.initialize(token);
  })
}

Main.wrapPort = function(port) {
  appConfig.addMainProcessPorts(port);
  return port;
}


module.exports = Main;
