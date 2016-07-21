var express = require('express')
  , MongoClient = require('mongodb').MongoClient
  , format = require('util').format
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , cookie = require('cookie')
  , gamer = require('./library/models/gamer');

var MONGO_DB_URL = process.env.MONGO_DB || 'mongodb://localhost:27017/tic-tac-toe';
var APP_HOST = process.env.APP_HOST || 'localhost'; 
var APP_PORT = process.env.APP_PORT || 3000;
var SESSION_SECRET = process.env.SESSION_SECRET || 'CHANGE_ME';
var db = null;
var session_store = new express.session.MemoryStore();
var initialize = function(callback) {
  app.configure('development', function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.session({ 
      key: 'sid',
      secret: SESSION_SECRET,
      store: session_store
    }));
  });
  io.set('authorization', function (data, accept) {
    if(data.headers['cookie']) {
      data.cookie = cookie.parse(data.headers.cookie);
      data.sessionID = data.cookie['sid'];
      if(session_store.sessions[data.sessionID] == null) {
        session_store.sessions[data.sessionID] = {}
      }
    } else {
    
     return accept('No cookie transmitted.', false);
    }
    accept(null, true);
  });
  MongoClient.connect(MONGO_DB_URL, function(err, _db) {
    if(err) return callback(err);
    db = _db;
    callback(null, app, io, session_store, db);
  });
};

var run = function(callback) {
  gamer(db).init(function(err, result) {
    if(err) return callback(err);

    server.listen(APP_PORT, APP_HOST, function(err) {
      if(err) {
        db.close();
        return callback(err);
      }

      console.log(
          [ ""
          , "tic-tac-toe server v" + require('./package.json').version
          , "listening on port " + APP_PORT + " and host " + APP_HOST
        ].join('\n'));

      callback(null);
    });
  });  
}

exports.initialize = initialize;
exports.run = run;
