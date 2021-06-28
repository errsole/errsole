'use strict';

const slash = require('slash');

var appConfig = {
  "sessionAPIServer"          : "api.errsole.com",
  "sessionAPIServerPort"      : 80,
  "routerURL"                 : "ws://router.errsole.com/ws",
  'routerRealm'               : "errsole-realm",
  "appToken"                  : null,
  "frameworkName"             : "express",
  "appProcessId"              : null,
  "statusCodes"               : [],
  "mainDirectory"             : null,
  "mainProcessPorts"          : [],
  "invokeType"                : "last",
  "nodeFrameworkKeys"       : {}
};


module.exports = {
  addMainProcessPorts: function(port) {
    appConfig.mainProcessPorts.push(port);
  },
  getMainProcessPorts: function() {
    return appConfig.mainProcessPorts;
  },
  getAppToken: function() {
    return appConfig.appToken;
  },
  setAppToken: function(appToken) {
    appConfig.appToken = appToken;
  },
  setAppProcessId: function(appProcessId) {
    appConfig.appProcessId = appProcessId;
  },
  setStatusCodes: function(statusCodes) {
    appConfig.statusCodes = statusCodes;
  },
  setMainDirectory: function(value) {
    appConfig.mainDirectory = slash(value);
  },
  getSessionAPIServer: function() {
    return appConfig.sessionAPIServer;
  },
  getSessionAPIServerPort: function() {
    return appConfig.sessionAPIServerPort;
  },
  getAppProcessId: function() {
    return appConfig.appProcessId;
  },
  getMainDirectory: function() {
    return appConfig.mainDirectory;
  },
  getRouterUrl: function() {
    return appConfig.routerURL;
  },
  getRouterRealm: function() {
    return appConfig.routerRealm;
  },
  getInvokeType: function() {
    return appConfig.invokeType;
  },
  getFrameworkName: function() {
    return appConfig.frameworkName;
  },
  setNodeFrameworkKeys: function(frameworkName, frameworkkeys) {
    appConfig.nodeFrameworkKeys[frameworkName] = frameworkkeys;
  },
  sessionStore: null
};
