'use strict'

var activeForks = {};

module.exports = {
  addFork: function(debuggerSessionId, childConnectorInstance) {
    activeForks[debuggerSessionId] = childConnectorInstance;
  },
  getFork: function(debuggerSessionId) {
    return activeForks[debuggerSessionId];
  },
  removeFork: function(debuggerSessionId) {
    delete activeForks[debuggerSessionId];
  },
  hasFork: function(debuggerSessionId) {
    var isAlreadyExist = activeForks[debuggerSessionId] ? true : false;
  	return isAlreadyExist;
  },
  allActiveForks: activeForks
};
