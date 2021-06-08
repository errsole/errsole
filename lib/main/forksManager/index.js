'use strict'

var Net = require('net');
var Fork = require('../../fork/fork');
var Events = require('../eventCapture/events');
var Server = require('../connection/server');
var appConfig = require('../../config');
var activeForks = require('./activeForks');

var MINIMUM_PORT = 50000;
var MAXIMUM_PORT = 60000;

var ForksManager= {};

ForksManager.initialize = function() {
  var self = this;
  var appPorts = appConfig.getMainProcessPorts();
  Events.on(Events.ROUTER_CONNECTION_ESTABLISHED, function() {
    Server.register(Server.START_DEBUGGER_URI, function(args, kwargs, details) {
      checkOrphanForkProcess();
      var appProcessId = appConfig.getAppProcessId();
      var debuggerSessionId = kwargs.debuggerSessionId || null;
      if(!debuggerSessionId) {
        return false;
      }
      var fork = null;
      if (activeForks.hasFork[debuggerSessionId]) {
        return false;
      }
      return getPorts(appPorts.length + 1).then(async function(ports) {
        var forkOptions = {};
        forkOptions.debugPort = ports.pop();
        forkOptions.ports = {};
        forkOptions.debuggerSessionId = debuggerSessionId;
        for(var index in appPorts) {
          var port = appPorts[index];
          forkOptions.ports[port] = ports.pop();
        }
        fork = new Fork(forkOptions);
        try {
          var forkResult = await fork.start();
          return forkResult;
        } catch (e) {
          return false;
        }
      }).then(function(data) {
        activeForks.addFork(debuggerSessionId, fork);
        return {
          'appProcessId': appProcessId
        };
      })
      .catch(function(e) {
        activeForks.removeFork(debuggerSessionId);
        return {
          'error': 'Unable to start debugger'
        };
      });
      return {
        'status': true,
        'appProcessId': appProcessId
      };
    }, {
      invoke: appConfig.getInvokeType()
    });
  });
};

function getPorts(num) {
  return new Promise(function(resolve, reject) {
    var promises = [];
    for (var index = 0; index < num; index++) {
      promises.push(reservePort());
    }
    Promise.all(promises).then(function(dummyServers) {
      var ports = [];
      for (var index = 0; index < dummyServers.length; index++) {
        ports.push(dummyServers[index].address().port);
        dummyServers[index].close();
      }
      resolve(ports);
    }).catch(function(e) {
      reject('failed to get ports');
    });
  });
};

function reservePort() {
  return new Promise(function(resolve, reject) {
    var server = Net.createServer();
    var retries = 0;
    var maxRetries = 5;
    server.listen(Math.floor(Math.random() * (MAXIMUM_PORT - MINIMUM_PORT + 1)) + MINIMUM_PORT);
    server.once('listening', function(err) {
      resolve(server);
    });
    server.on('error', function(err) {
      if (retries < maxRetries) {
        retries++;
        server.listen(Math.floor(Math.random() * (MAXIMUM_PORT - MINIMUM_PORT + 1)) + MINIMUM_PORT);
      } else {
        reject('max retries exceeded');
      }
    });
  });
};

function checkOrphanForkProcess() {
  var allActiveForks = activeForks.allActiveForks;
  for(var key in allActiveForks) {
    var debuggerSessionId = key;
    Server.call('com.errsole.web.debugger_session.'+debuggerSessionId+'.ping', [], {})
    .then(function(result) {
      if(result !== 'pong') {
        if(allActiveForks[key]._forkedProcess.kill) {
          allActiveForks[key]._forkedProcess.kill('SIGINT');
        }
        activeForks.removeFork(debuggerSessionId);
      }
    })
    .catch(function(e) {
      if(allActiveForks[key]._forkedProcess.kill) {
        allActiveForks[key]._forkedProcess.kill('SIGINT');
      }
      activeForks.removeFork(debuggerSessionId);
    });
  }
}


module.exports = ForksManager;
