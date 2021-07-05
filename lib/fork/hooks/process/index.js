'use strict'

var ProcessHook = {};

ProcessHook.initialize = function() {
  handleUncaughtExceptions();
};

ProcessHook.exitProcess = function() {
  process.exit(0);
}

function handleUncaughtExceptions() {
  process.on('uncaughtException', function(err) {
    console.error(err);
  });
}

ProcessHook.packages = [];

module.exports = ProcessHook;
