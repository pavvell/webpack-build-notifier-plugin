let app = require('express')();
let http = require('http').Server(app);

let SSE = require('express-sse');
let sse = new SSE();

let EVENTS = {
  BUILD: 'BUILD'
};

function BuildNotifierPlugin(options) {
  this.settings = {
    port:  options.port  || 3003,
    debug: options.debug || false
  };

  this.state = {
    setupIsDone: false,
  };
}

BuildNotifierPlugin.prototype.emit = function (eventName, payload) {
  if (this.settings.debug) {
    console.log('[BuildNotifierPlugin] emitting an event:', eventName);
  }

  sse.send(JSON.stringify(payload), eventName);
};

BuildNotifierPlugin.prototype.setup = function() {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.get('/stream', sse.init);

  http.listen(this.settings.port, () => {
    console.log(`Build notifier is mounted on *:${this.settings.port}`);
  });

  this.state.setupIsDone = true;
};

BuildNotifierPlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', () => {

    if (!this.state.setupIsDone) {
      this.setup();
    }

    this.emit(EVENTS.BUILD, null);
  });
};

module.exports = BuildNotifierPlugin;