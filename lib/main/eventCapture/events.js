'use strict'

var EventEmitter = require('events');

var ErrsoleEvents = new EventEmitter();

ErrsoleEvents.UNCAUGHT_EXCEPTION = 'errsole.uncaught_exception';
ErrsoleEvents.HTTP_RESPONSE_SENT = 'errsole.http_response_sent';
ErrsoleEvents.ROUTER_CONNECTION_ESTABLISHED = 'errsole.router_connection_established';

module.exports = ErrsoleEvents;
