let app = require('express')();
let http = require('http').Server(app);

let SSE = require('express-sse');
let sse = new SSE();

let EVENTS = {
  BUILD: 'BUILD'
};

function ReloadPlugin(options) {
  this.settings = {
    port: options.port || 3003
  };

  this.state = {
    setupIsDone: false,
  };
}

ReloadPlugin.prototype.emit = function (eventName, payload) {
  sse.send(JSON.stringify(payload), eventName)
};

ReloadPlugin.prototype.setup = function() {
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

ReloadPlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', function() {

    if (!this.state.setupIsDone) {
      this.setup();
    }

    this.emit(EVENTS.BUILD, null);
  });
};

module.exports = ReloadPlugin;