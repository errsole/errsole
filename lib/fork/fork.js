'use strict'

var ChildProcess = require('child_process');
var Debugger = require('../main/inspector');
var Ipc = require('./ipc');
var Http = require('./http');

var Fork = function (options) {
  this._debuggerSessionId = options.debuggerSessionId;
  this._ports = options.ports;
  this._debugPort = options.debugPort;
  this._forkedProcess = null;
  this._status = null;
}

Fork.prototype.start = async function() {
  var self = this;
  return new Promise(async function(resolve, reject) {
    var appStartFile = require.main.filename;
    var args = process.argv.slice(2);
    var options = getForkOptions(self._debuggerSessionId, self._ports, self._debugPort);
    self._forkedProcess = ChildProcess.fork(appStartFile, args, options);

    try {
      var isProcessStarted = await self._isChildProcessStarted();
      if(!isProcessStarted) {
        self._forkedProcess.kill('SIGINT');
        reject(new Error('Errsole Internal Error: Unable to start the child process.'));
      }
    } catch(e) {
      reject(new Error('Errsole Internal Error: Unable to start the child process.'));
    }

    try {
      var isDebuggerStarted = await self._isDebuggerStarted();
      if(!isDebuggerStarted) {
        self._forkedProcess.kill('SIGINT');
        reject(new Error('Errsole Internal Error: Unable to start the debugger for child process.'));
      }
    } catch(e) {
      self._forkedProcess.kill('SIGINT');
      reject(new Error('Errsole Internal Error: Unable to start the debugger for child process.'));
    }

    self.Http = new Http(self._ports);
    resolve(true);
  });
}


Fork.prototype._isChildProcessStarted = function() {
  var self = this;
  self.Ipc = new Ipc(self._forkedProcess);
  return new Promise(function(resolve, reject) {
    self.Ipc.onChildProcessStartSuccess(function(data) {
      resolve(true);
    });
    self.Ipc.onChildProcessStartFailure(function(data) {
      reject(false);
    });
  })
}


Fork.prototype._isDebuggerStarted = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      self.Debugger = new Debugger(self._debugPort, self._debuggerSessionId, self._forkedProcess);
      self.Debugger.on('debuggerStarted', function(data) {
        if(data.debuggerSessionId == self._debuggerSessionId) {
          var isDebuggerStarted = data.status;
          if(isDebuggerStarted) {
            resolve(true);
          } else {
            reject(false);
          }
        } else {
          reject(false);
        }
      });
    } catch (err) {
      console.error(new Error('Errsole Internal Error: '+(err.message || err.toString())+'. Please report the issue at https://github.com/errsole/errsole/issues'));
      reject(false);
    }
  });
}

function getForkOptions(debuggerSessionId, ports, debugPort) {
  var options = {
    env: Object.assign({}, process.env, {
      ERRSOLE_FORK: "true",
      ERRSOLE_DEBUGSESSION_ID: debuggerSessionId,
      ERRSOLE_PORTS: JSON.stringify(ports)
    })
  }
  options.ports = Object.keys(ports).map(val => ports[val]);
  options.execArgv = process.execArgv.slice();
  options.execArgv.push('--inspect=' + debugPort);
  return options;
}

module.exports = Fork;
