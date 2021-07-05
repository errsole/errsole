'use strict'

var appConfig = require('../../../config');

var ExpressHook = {};

function wrapExpress(_express) {
  return _express;
}

function wrapExpressSession(_session) {
  var MemoryStore = _session.MemoryStore;
  var sessionStore = new MemoryStore();
  appConfig.sessionStore = sessionStore;
  var session = function session(options) {
    options.store = sessionStore;
    return _session(options);
  };
  Object.setPrototypeOf(session, _session);
  return session;
}


ExpressHook.packages = [
  {
    name: 'express',
    wrapper: wrapExpress
  },
  {
    name: 'express-session',
    wrapper: wrapExpressSession
  }
];

module.exports = ExpressHook;
