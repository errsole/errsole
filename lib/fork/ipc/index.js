'use strict'


var EventEmitter = require('events');
var inherits = require('util').inherits;

function Ipc(childProcess) {
  EventEmitter.call(this);
  this._childProcess = childProcess;
  this._listenParentProcess();
};
inherits(Ipc, EventEmitter);

Ipc.prototype._listenParentProcess = function(payload) {
  var self = this;
  this._childProcess.on('message', function(data) {
    var msg = data.data;
    if(msg.type === 'process_started') {
      self._childProcess.removeAllListeners('error');
      self.emit('childProcessStartSuccess', data);
    }
    if(msg.type === 'process_exit') {
      self.emit('chilProcessExitRequest', data);
    }
    if(msg.type === 'errsole_session_update_response') {
      self.emit('sessionUpdateResponse');
    }
  });
};

Ipc.prototype.sendMessage = function(payload) {
  this._childProcess.send(payload);
};

Ipc.prototype.onExit = function(callback) {
  this._childProcess.on('exit', (function(code, signal) {
    this._childProcess.removeAllListeners();
    callback({
      code: code,
      signal: signal
    });
  }).bind(this));
};

Ipc.prototype.onSessionUpdateResponse = function(callback) {
  this.once('sessionUpdateResponse', callback);
};

Ipc.prototype.onError = function(callback) {
  this._childProcess.on('error', callback);
};

Ipc.prototype.onChilProcessExitRequest = function(callback) {
  this.on('chilProcessExitRequest', callback);
};

Ipc.prototype.onChildProcessStartSuccess = function(callback) {
  this.once('childProcessStartSuccess', callback);
};

Ipc.prototype.onChildProcessStartFailure = function(callback) {
  this._childProcess.on('childProcessStartFailure', callback);
};

module.exports = Ipc;
