var emit_message = require("./shared").emit_message
   is_authenticated = require("./shared").is_authenticated
  , emit_message_all = require("./shared").emit_message_all
  , emit_error = require("./shared").emit_error;

var user = require('../models/user')
  , gamer = require('../models/gamer');

var newuser = function(io, socket, session_store, db) {
  var calling_method_name = "signup";
  return function(data) {
    var full_name = data.full_name;
    var user_name = data.user_name;
    var password = data.password;
    user(db).findByUser(user_name, function(err, _user) {
      if(err) return emit_error(calling_method_name, err.message, socket);
      if(_user != null) 
        return emit_error(calling_method_name, "User with user name " + user_name + " already exists", socket);
      user(db).createUser(full_name, user_name, password, function(err, _user) {
        if(err) return emit_error(calling_method_name, err.message, socket);
        emit_login_or_registration_ok(io, calling_method_name, db, session_store, user_name, socket);        
      });
    })
  }
}

var olduser= function(io, socket, session_store, db) {
  var calling_method_name = "login";
  return function(data) {
    var user_name = data.user_name;
    var password = data.password;
    user(db).findByUserAndPassword(user_name, password, function(err, user) {
     if(err) return emit_error(calling_method_name, err.message, socket);  
      if(user == null) return emit_error(calling_method_name, "User or Password is incorrect", socket);
     
      emit_login_or_registration_ok(io, calling_method_name, db, session_store, user_name, socket);
    });
  }
}

var emit_login_or_registration_ok = function(io, event, db, session_store, user_name, socket) {
  // Easier to keep track of where we emitting messages
  var event_name          = "gamer_joined";
  gamer(db).updateGamer(user_name, socket.handshake.sessionID, function(err, result) {
    if(err) return emit_error(event, err.message, socket);
    if(result == 0) return emit_error(event, "Failed to Save user as active", socket);
    // Set authenticated on the session
    session_store.sessions[socket.handshake.sessionID].user_name = user_name;
    emit_message(event, {
      ok: true
    }, socket);
    gamer(db).findGamerBySid(socket.handshake.sessionID, function(err, gamer) {
      if(err) return;
      emit_message_all(io, event_name, {
          ok: true
        , result: gamer
      }, socket.handshake.sessionID);
    });
  });  
}

exports.newuser = newuser;
exports.olduser = olduser;
