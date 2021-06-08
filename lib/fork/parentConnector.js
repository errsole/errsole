'use strict'

function ParentConnector() {
  this._forkedProcess = process;
}

ParentConnector.prototype.sendMessage = function(payload) {
  this._forkedProcess.send(payload);
}

ParentConnector.prototype.onMessage = function(callback) {
  this._forkedProcess.on('message', callback);
}

ParentConnector.prototype.processStarted = function () {
  var payload = {
    "data": {
      "type": 'process_started'
    }
  }
  this.sendMessage(payload);
}

module.exports = new ParentConnector();
