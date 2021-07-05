'use strict'

var DebugAPI = require('../inspector/debugAPI');
var Server = require('./server');
var ServerConnector = {};

ServerConnector.attachMethods = function (connection, debuggerSessionId, forkedProcess) {
  var debugAPI = new DebugAPI(connection, debuggerSessionId, forkedProcess);

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.get_parsed_scripts', async function(...args) {
    try {
      var result = await debugAPI.getScriptParsed(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.get_script_source', async function(...args) {
    try {
      var result = debugAPI.getScriptSource(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.set_script_source', async function(...args) {
    try {
      var result = debugAPI.updateScriptSource(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.set_breakpoint', async function(...args) {
    try {
      var result = debugAPI.setBreakpoint(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.remove_breakpoint', async function(...args) {
    try {
      var result = debugAPI.removeBreakpoint(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.stop_debugger', async function(...args) {
    try {
      var result = debugAPI.stopModuleDebugger(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.post_request', async function(...args) {
    try {
      var result = debugAPI.postRequest(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.resume', async function(...args) {
    try {
      var result = debugAPI.resumeExecution(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.step_over', async function(...args) {
    try {
      var result = debugAPI.stepOver(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.step_into', async function(...args) {
    try {
      var result = debugAPI.stepInto(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.step_out', async function(...args) {
    try {
      var result = debugAPI.stepOut(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.get_properties', async function(...args) {
    try {
      var result = debugAPI.getProperties(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.evaluate_console_expression', async function(...args) {
    try {
      var result = debugAPI.RuntimeConsoleEvaluate(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });

  Server.register('com.errsole.module.debugger_session.'+debuggerSessionId+'.evaluate_watch_expression', async function(...args) {
    try {
      var result = debugAPI.RuntimeWatchExpressionEvaluate(...args);
      return result;
    } catch(e) {
      console.log(e);
    }
  });
}


module.exports = ServerConnector;
