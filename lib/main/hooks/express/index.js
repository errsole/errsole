'use strict'

var Events = require('../../eventCapture/events');

var ExpressHook = {};

function wrapExpress(_express) {
  var express = function createApplication() {
    var app = _express();
    app.use(errsoleWatcher);
    app.use(errsoleResponseCapture);
    process.nextTick(function() {
      app.use(errsoleErrorHandler);
    });
    return app;
  };
  Object.setPrototypeOf(express, _express);
  return express;
}

function wrapExpressSession(_session) {
  var session = function session(options) {
    var _middleware = _session(options);
    return function session(req, res, next) {
      _middleware(req, res, function(arg) {
        if (req.sessionID) {
          req.errsole.session = {
            sid: req.sessionID,
            session: req.session
          };
        }
        next(arg);
      });
    };
  };
  Object.setPrototypeOf(session, _session);
  return session;
}

function errsoleErrorHandler(err, req, res, next) {
  req.errsole.error = err;
  next(err);
}

function errsoleWatcher(req, res, next) {
  req.errsole = {};
  req.headers.busboyId = Math.floor((Math.random() * 1000000000) + 1);
  var id = Math.random();
  var reqStartTime = process.hrtime.bigint();
  var afterResponse = function() {
    req.errsole.responseTime = ((process.hrtime.bigint() - reqStartTime)/1000000n).toString();
    Events.emit(Events.HTTP_RESPONSE_SENT, {
      frameworkName: 'express',
      request: req,
      response: res
    });
  };

  if(res._events) {
    if(res._events.finish) {
      res.on('finish', afterResponse);
    } else if(res._events.close) {
      res.on('close', afterResponse);
    } else {
      throw new Error('unable to attach error watcher');
    }
  } else {
    throw new Error('unable to attach error watcher');
  }
  next();
}

function errsoleResponseCapture(req, res, next) {
  req.errsole.responseBody = '';
  var _resWrite = res.write;
  res.write = function write(chunk, encoding, callback) {
    if (!chunk) {
      req.errsole.responseBody += '';
    } else if (Buffer.isBuffer(chunk)) {
      req.errsole.responseBody += chunk.toString(encoding);
    } else if (typeof chunk === 'string') {
      req.errsole.responseBody += chunk;
    } else {
      req.errsole.responseBody = 'Response not available';
    }
    _resWrite.call(res, chunk, encoding, callback);
  };
  if (parseInt(process.versions.node) >= 8) {
    var _resEnd = res.end;
    res.end = function end(chunk, encoding) {
      if (!chunk) {
        req.errsole.responseBody += '';
      } else if (Buffer.isBuffer(chunk)) {
        req.errsole.responseBody += chunk.toString(encoding);
      } else if (typeof chunk === 'string') {
        req.errsole.responseBody += chunk;
      } else {
        req.errsole.responseBody = 'Response not available';
      }
      _resEnd.call(res, chunk, encoding);
    };
  }
  next();
};

ExpressHook.packages = [{
    name: 'express',
    wrapper: wrapExpress
  }, {
    name: 'express-session',
    wrapper: wrapExpressSession
  }
];

module.exports = ExpressHook;
