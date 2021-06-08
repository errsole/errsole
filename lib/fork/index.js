'use strict'

var ParentConnector = require('./parentConnector');
var Hook = require('./hooks');
var appConfig = require('../config');

var Fork = {};

Fork.initialize = function(options) {
  Hook.initialize();
  ParentConnector.processStarted();
}

function parentMessageCallback(data) {
  if (data.data.type == 'errsole_session_update') {
    updateExpressSession(data);
  }
};
ParentConnector.onMessage(parentMessageCallback);

function updateExpressSession(data) {
  var sessId = data.data.attributes.sid;
  var sessObj = data.data.attributes.session;
  var sessionStore = appConfig.sessionStore;
  sessionStore.set(sessId, sessObj, function(err, session) {
    if (!err) {
      var payload = {
        "data": {
          "type": 'errsole_session_update_response',
          "attributes": {
            "success": true
          }
        }
      };
    }
    ParentConnector.sendMessage(payload);
  });
};

Fork.wrapPort = function(port) {
  var portsMap = JSON.parse(process.env.ERRSOLE_PORTS);
  return portsMap[port] || 0;
}

module.exports = Fork;
