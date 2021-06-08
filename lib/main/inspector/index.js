'use strict'

var CDP = require('chrome-remote-interface');
var EventEmitter = require('events');
var inherits = require('util').inherits;
var Server = require('../connection/server');
var ServerConnector = require('../connection/serverConnector');
var DebugAPI = require('./debugAPI');

function Debugger(debugPort, debuggerSessionId, forkedProcess) {
  EventEmitter.call(this);
  this._debugPort = debugPort;
  this._debuggerSessionId = debuggerSessionId;
  this._connection = null;
  this._connected = false;
  this._debugAPI = null;
  this._forkedProcess = forkedProcess;
  this._setupConnection();
};
inherits(Debugger, EventEmitter);

Debugger.prototype._setupConnection = async function() {
  var self = this;
  var debugPort = self._debugPort;

  if (parseInt(process.versions.node) >= 8) {
    try {
        self._connection = await CDP({
          host: 'localhost',
          port: debugPort || 0
        });
        self._attachDebuggerInstance();
        self._connected = true;
      } catch (err) {
          console.error(new Error('Errsole Internal Error: '+(err.message || err.toString())+'. Please report the issue at https://github.com/errsole/errsole/issues'));
      } finally {
        var payload = {
          'type': 'debuggerStarted',
          'status': self._connected,
          'debuggerSessionId': self._debuggerSessionId
        }
        self.emit('debuggerStarted', payload);
        return self._connected;
      }
  } else {
    return false;
  }
};

Debugger.prototype._attachDebuggerInstance = function() {
  this.attachRegisterHandler();
};

Debugger.prototype.attachRegisterHandler = function () {
  ServerConnector.attachMethods(this._connection, this._debuggerSessionId, this._forkedProcess);
}

module.exports = Debugger;
