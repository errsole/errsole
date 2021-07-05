'use strict'

var ErrsoleMain = require('./main');
var ErrsoleFork = require('./fork');

var Errsole = {};

Errsole.initialize = function(options) {
  if (parseInt(process.versions.node) < 8) {
    throw new Error('Errsole does not support your Node.js version. Errsole supports Node.js version 8 or higher.');
  }
  if(!options || !options.token) {
    throw new Error('App token is missing in the initialize function arguments. For more information, visit our documentation page at https://errsole.com/documentation');
  }
  if (Errsole.isForkedProcess()) {
    return ErrsoleFork.initialize(options);
  } else {
    return ErrsoleMain.initialize(options);
  }
}

Errsole.isForkedProcess = function() {
  return process.env.ERRSOLE_FORK;
}

Errsole.wrapPort = function(port) {
  if(!port) {
    throw new Error('Port is missing in the wrapPort function arguments. For more information, visit our documentation page at https://errsole.com/documentation');
  }
  if (Errsole.isForkedProcess()) {
    return ErrsoleFork.wrapPort(port);
  } else {
    return ErrsoleMain.wrapPort(port);
  }
}

module.exports = Errsole;
