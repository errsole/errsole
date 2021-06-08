'use strict'

var Module = require('module');

var ExpressHook = require('./express');
var ProcessHook = require('./process');

var Hooks = {
  wrappers: {}
}

Hooks.initialize = function() {
  initHooks();
  wrapRequire();
}

function initHooks() {
  Hooks.process = ProcessHook;
  Hooks.express = ExpressHook;
  registerHookWrappers(ProcessHook);
  registerHookWrappers(ExpressHook);
}

function registerHookWrappers(hook) {
  hook.packages.forEach(function(pkg) {
    Hooks.wrappers[pkg.name] = pkg.wrapper;
  });
}

function wrapRequire() {
  var originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    var origPackage = originalRequire.call(this, id);
    if (id in Hooks.wrappers) {
      return Hooks.wrappers[id](origPackage);
    } else {
      return origPackage;
    }
  }
}

module.exports = Hooks;
