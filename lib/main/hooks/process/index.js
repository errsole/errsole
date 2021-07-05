'use strict'

var Events = require('../../eventCapture/events');

var ProcessHook = {};

ProcessHook.initialize = function() {
  handleUncaughtExceptions();
}

ProcessHook.exitProcess = function(code) {
  if(!code) {
    var code = 1;
  }
  process.exit(code);
}

function handleUncaughtExceptions() {
  process.on('uncaughtException', function(err) {
    var payload = {
      error: err
    };
    Events.emit(Events.UNCAUGHT_EXCEPTION, payload);
  });
}

ProcessHook.packages = [];

module.exports = ProcessHook;
