var db_env_console                               = require('./db_env_console')
  , newuser                  = require('./library/files/logs').newuser
  , olduser                     = require('./library/files/logs').olduser
  , usersstat         = require('./library/files/gamesstat').usersstat
  , request_call                      = require('./library/files/gamesstat').request_call
  , reject                     = require('./library/files/gamesstat').reject
  , play                       = require('./library/files/gamesstat').play
  , cross_O                      = require('./library/files/gamesstat').cross_O
   , main                  = require('./library/controls/main');
db_env_console.initialize(function(err, app, io, session_store, db) {
  if(err) throw err;
  app.get('/', main.index());
  io.sockets.on('connection', function (socket) {
    socket.on('signup', newuser(io, socket, session_store, db));
    socket.on('login', olduser(io, socket, session_store, db));
    socket.on('usersstat', usersstat(io, socket, session_store, db));
    socket.on('request_call', request_call(io, socket, session_store, db));
    socket.on('reject', reject(io, socket, session_store, db));
    socket.on('play', play(io, socket, session_store, db));
    socket.on('cross_O', cross_O(io, socket, session_store, db));
    socket.emit('data', {event:'init', ok:true, result: socket.handshake.sessionID});
  });
  db_env_console.run(function(err) {
    if(err) throw err;
  });
});