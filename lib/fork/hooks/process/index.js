'use strict'

var ProcessHook = {};

function handleUncaughtExceptions() {
  process.on('uncaughtException', function(err) {
    console.erro(err)
  });
}

ProcessHook.initialize = function() {
  handleUncaughtExceptions();
};

ProcessHook.exitProcess = function() {
  process.exit(0);
}

ProcessHook.packages = [];

module.exports = ProcessHook;
