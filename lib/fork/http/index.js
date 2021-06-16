'use strict'

var http = require('http');
var fs = require('fs');
var FormData = require('form-data');
var querystring = require('querystring');
var activeForks = require('../../main/forksManager/activeForks');

function Http(ports) {
  this._ports = ports;
  this._protocol = 'http:';
  this._hostname = 'localhost';
  this._followRedirect = true;
  this._maxRedirects = 10;
  this._abort = false;
}

var sessionOptions = {};

Http.prototype.abortRequest = function(val) {
  this._abort = val;
}

Http.prototype.postRequestsListener = async function(data, debuggerSessionId) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var meta = data.meta;
    var errorOccurenceId = data.id;
    if(activeForks.hasFork(debuggerSessionId)) {
      var fork = activeForks.getFork(debuggerSessionId);
      var sessionData = data.attributes.details.sessionData;
      var fileUrl = data.attributes.details.fileUrl;
      var contentType = data.attributes.details.requestData.headers['content-type'];
      if(contentType) {
        var isMultipart = contentType.includes('multipart');
      }
      if (sessionData && sessionData.sid && sessionData.session) {
        var payload = {
          "data": {
            "type": 'errsole_session_update',
            "id": '',
            "attributes": {
              "sid": sessionData.sid,
              "session": sessionData.session
            }
          }
        };
        fork.Ipc.sendMessage(payload);
        fork.Ipc.onSessionUpdateResponse(function(response) {
          if(fileUrl && isMultipart) {
            self.doMultipartRequest(data, function(response) {
              resolve(response);
            }, function(response) {
              resolve(response);
            });
          } else {
            self.doRequest(data, function(response) {
              resolve(response);
            }, function(response) {
              resolve(response);
            });
          }
        });
      } else {
        if(fileUrl && isMultipart) {
          self.doMultipartRequest(data, function(response) {
            resolve(response);
          }, function(response) {
            resolve(response);
          });
        } else {
          self.doRequest(data, function(response) {
            resolve(response);
          }, function(response) {
            resolve(response);
          });
        }
      }
    } else {
      var errorPayload = createErrorPayload(data);
      reject(errorPayload);
    }
  });
}

Http.prototype.doMultipartRequest = function(data, callback) {
    var self = this;
    var fileUrl = data.attributes.details.fileUrl;
    getFileData(fileUrl, function(err, fileResult) {
      if(err) {
        var errorPayload = createErrorPayload(data);
        callback(errorPayload);
      }
      fileResult = JSON.parse(fileResult);
      var form = makeForm(data, fileResult);
      var meta = data.meta;
      var errorData = data.attributes.details;
      var requestData = errorData.requestData;
      var requestObject = prepareRequest(requestData);
      var payload = requestObject.payload;
      var url = requestObject.url ? requestObject.url : '/';
      var port = self._ports[requestObject.localPort];

      if (!port) {
        if(Object.keys(self._ports).length == 1) {
          port = self._ports[Object.keys(self._ports)[0]];
        } else if(!port) {
          var payload = {
            "errors":{
              "id": '',
              "title": "Problem with request",
              "detail": "Port not mapped in child process. Unable to rerun request.",
              "source": ''
            },
            "meta": ''
          };
          callback(payload);
        }
      }
      var options = {
        "protocol": self._protocol,
        "hostname": self._hostname,
        "port": port,
        "path": url,
        "method": requestObject.method,
        "headers": requestObject.headers
      };
      var link = options.protocol+'//'+options.hostname+':'+port+''+options.path;
      form.submit(link, function(err, response) {
        if(err) {
          callback(err);
        }
        else {
          var payload = {
            "data": {
              "type": "errors",
              "id": 'userId',
              "attributes": {
                "response": {
                  'statusCode': response.statusCode,
                  'statusMessage': response.statusMessage,
                  'headers': response.headers,
                  'payload': response.body
                }
              }
            },
            "meta": ''
          };
          callback(payload);
        }
      });
    });
};

Http.prototype.doRequest = function(data, callback, abortCallback) {
    var self = this;
    var meta = data.meta;
    var errorData = data.attributes.details;
    var requestData = errorData.requestData;
    var requestObject = prepareRequest(requestData);
    var payload = requestObject.payload;
    var url = requestObject.url ? requestObject.url : '/';
    var port = this._ports[requestObject.localPort];
    if (!port) {
      if(Object.keys(self._ports).length == 1) {
        port = self._ports[Object.keys(self._ports)[0]];
      } else if(!port) {
        var payload = {
          "errors":{
            "id": '',
            "title": "Problem with request",
            "detail": "Port not mapped in child process. Unable to rerun request.",
            "source": ''
          },
          "meta": ''
        };
        callback(payload);
      }
    }
    var options = {
      "protocol": this._protocol,
      "hostname": this._hostname,
      "port": port,
      "path": url,
      "method": requestObject.method,
      "headers": requestObject.headers
    };
    var req = http.request(options, function(response) {
      var body;
      response.on('data', function(d) {
        if (body) {
          body = Buffer.concat([body, d], body.length + d.length);
        } else {
          body = d;
        }
      });
      response.on('end', function() {
        if (self._abort) {
          abortCallback({
            "data": {
              "type": "errors",
              "id": 'userId',
              "attributes": {
                "success": true
              }
            },
            "meta": meta
          });
        } else {
          var payload = {
            "data": {
              "type": "errors",
              "id": 'userId',
              "attributes": {
                "response": {
                  'statusCode': response.statusCode,
                  'statusMessage': response.statusMessage,
                  'headers': response.headers,
                  'payload': body
                }
              }
            },
            "meta": meta
          };
          callback(payload);
        }
      });
    });

    req.on('error', function(e) {
      var payload = {
          "errors": [
            {
              "id": 'errorAttr.data.id',
              "title": "Problem with request",
              "detail": e.message,
              "source": data
            }
          ],
          "meta": data.meta
      };
      callback(payload);
    });

    if (payload && payload.length > 0) {
      req.write(payload);
    }
    req.end();
};

function prepareRequest(reqData) {
  var returnObject = {};
  for (var key in reqData) {
    if (key != 'headers') {
      returnObject[key] = reqData[key];
    }
  };
  returnObject.headers = {};

  for (var key in reqData.headers) {
    var lowercaseKey = key.toLowerCase();
    returnObject.headers[lowercaseKey] = reqData.headers[key];
  };
  if (returnObject.headers['content-type'] === 'application/json') {
    returnObject.payload = JSON.stringify(reqData.payload);
    returnObject.headers['content-length'] = Buffer.byteLength(returnObject.payload);
  } else if (returnObject.headers['content-type'] === 'application/x-www-form-urlencoded') {
    returnObject.payload = querystring.stringify(reqData.payload);
    returnObject.headers['content-length'] = Buffer.byteLength(returnObject.payload);
  } else if (returnObject.headers['content-type'] === 'text/html') {
    returnObject.payload = querystring.stringify(reqData.payload);
    returnObject.headers['content-length'] = Buffer.byteLength(returnObject.payload);
  } else {
    //returnObject.payload = JSON.stringify(reqData.payload);
    // TODO: handle multipart/form-data and other possible content-types
  }

  if (returnObject.headers['transfer-encoding'] === 'chunked') {
    delete returnObject.headers['content-length'];
  }

  return returnObject;
};

function createErrorPayload(data) {
  var payload = {
      "errors": [
        {
          "title": "Unable to complete this action",
          "detail": "No child process found to handle the request",
        }
      ],
      "meta": ''
  };
  return payload;
};

function setOptions(session) {
  this.session = {};
  ret._MemoryStore = session.MemoryStore;
  if (options) {
    this.session.sessionStore = new options._MemoryStore();
  }
  sessionOptions.session = this.session;
};

function updateExpressSession(data) {
  var sessId = data.data.attributes.sid;
  var sessObj = data.data.attributes.session;
  var sessionStore = sessionOptions.session.sessionStore;
  sessionStore.set(sessId, sessObj, function(err, session) {
    if (!err) {
      var payload = {
        "data": {
          "type": 'errsoleSessionUpdateResponse',
          "attributes": {
            "success": true
          }
        },
        "meta": data.meta
      };
    }
    ParentConnector.sendMessage(payload);
  });
};

function getFileData(fileUrl, callback) {
  var path = fileUrl.split('https://s3.amazonaws.com')[1]
  const options = {
    hostname: 's3.amazonaws.com',
    path: path
  };
  const req = http.request(options, (res) => {
    var chunks = [];
    res.setEncoding('utf8');
    var body = '';
    res.on('data', (d) => {
      body = body + d;
    });
    res.on('end', () => {
      callback(null, body);
    });
  }).end();
  req.on('error', (e) => {
    callback(e);
  });
}

function makeForm(data, fileResult) {
  var form = new FormData();
  // add files in forms properly
  if(fileResult.file && typeof fileResult.file == 'object') {
    var filename = fileResult.file['fieldname'];
    var originalname = fileResult.file['originalname'];
    var encoding = fileResult.file['encoding'];
    var mimetype = fileResult.file['mimetype'];
    var size = fileResult.file['size'];
    if(fileResult.file['buffer']) {
      form.append(filename, Buffer.from(fileResult.file['buffer']['data']), {filename: originalname, encoding: encoding, contentType: mimetype, knownLength: size });
    } else if(fileResult.file['destination']) {
      var uri = fileResult.file['destination']+fileResult.file['filename']
      form.append(filename, fs.createReadStream(uri), {filename: originalname, encoding: encoding, contentType: mimetype, knownLength: size });
    }
  } else if(typeof fileResult.files == 'object' && Array.isArray(fileResult.files)) {
    for(var key in fileResult.files) {
      var filename = fileResult.files[key]['fieldname'];
      var originalname = fileResult.files[key]['originalname'];
      var encoding = fileResult.files[key]['encoding'];
      var mimetype = fileResult.files[key]['mimetype'];
      var size = fileResult.files[key]['size'];
      if(fileResult.files[key]['buffer']) {
        form.append(filename, Buffer.from(fileResult.files[key]['buffer']['data']), {filename: originalname, encoding: encoding, contentType: mimetype, knownLength: size });
      } else if(fileResult.files[key]['destination']) {
        var uri = fileResult.files[key]['destination']+fileResult.files[key]['filename']
        form.append(filename, fs.createReadStream(uri), {filename: originalname, encoding: encoding, contentType: mimetype, knownLength: size });
      }
    }
  } else if(typeof fileResult.files == 'object') {
    for(var key in fileResult.files) {
      var filename = key;
      for(var i in fileResult.files[key]) {
        var originalname = fileResult.files[key][i]['originalname'];
        var encoding = fileResult.files[key][i]['encoding'];
        var mimetype = fileResult.files[key][i]['mimetype'];
        var size = fileResult.files[key][i]['size'];
        if(fileResult.files[key][i]['buffer']) {
          form.append(filename, Buffer.from(fileResult.files[key][i]['buffer']['data']), {filename: originalname, encoding: encoding, contentType: mimetype, knownLength: size });
        } else if(fileResult.files[key][i]['destination']) {
          var uri = fileResult.files[key][i]['destination']+fileResult.files[key][i]['filename']
          form.append(filename, fs.createReadStream(uri), {filename: originalname, encoding: encoding, contentType: mimetype, knownLength: size });
        }
      }
    }
  }
  // add text payload in form
  var payloadData = data.attributes.details.requestData.payload;
  for(var key in payloadData) {
    form.append(key, payloadData[key]);
  }
  return form;
}
module.exports = Http;
