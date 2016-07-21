var API = function() {
  var self = this;
  this.socket = io.connect("http://" + document.domain);
  this.handlers = {};
  this.once_handlers = {};
  this.socket.on("data", function(data) {
    if(data && data.event) {
      var handlers = self.handlers[data.event];
      if(handlers != null) {
        for(var i = 0; i < handlers.length; i++) {
          data.is_error ? handlers[i](data) : handlers[i](null, data.result);
        }
      }   
      var handlers = self.once_handlers[data.event];
      if(handlers != null) {
        while(handlers.length > 0) {
          data.is_error ? handlers.pop()(data) : handlers.pop()(null, data.result);
        }
        delete self.once_handlers[data.event];
      }
    }
  });
}
API.prototype.on = function(event, callback) {
  if(this.handlers[event] == null) this.handlers[event] = [];
  this.handlers[event].push(callback);
}

// * signup an event listener callback for a single instance of the event

API.prototype.once = function(event, callback) {
  if(this.once_handlers[event] == null) this.once_handlers[event] = [];
  this.once_handlers[event].push(callback);
}

API.prototype.signup = function(full_name, user_name, password, callback) {  
  // Do basic validation
  if(full_name == null || full_name.length == 0) return callback(create_error("signup", "Full name cannot be empty"));
  if(user_name == null || user_name.length == 0) return callback(create_error("signup", "User name cannot be empty"));
  if(password == null || password.length == 0) return callback(create_error("signup", "Password name cannot be empty"));
  // signup callback
  this.once("signup", callback);
  // Fire message
  this.socket.emit("signup", {
      full_name: full_name
    , user_name: user_name
    , password: password
  });
}

API.prototype.login = function(user_name, password, callback) {  
  // Do basic validation
  if(user_name == null || user_name.length == 0) return callback(create_error("login", "User name cannot be empty"));
  if(password == null || password.length == 0) return callback(create_error("login", "Password name cannot be empty"));
  // signup callback
  this.once("login", callback);
  // Fire message
  this.socket.emit("login", {
      user_name: user_name
    , password: password
  });
}

API.prototype.usersstat = function(callback) {  
  this.once("usersstat", callback);
  this.socket.emit("usersstat", {});
}

API.prototype.request_call = function(gamer, callback) {
  this.once("request_call", callback);
  this.socket.emit("request_call", gamer);
} 
API.prototype.reject = function(invite, callback) {
  this.once("reject", callback);
  this.socket.emit("reject", invite);
}
API.prototype.play = function(invite, callback) {
  this.once("play", callback);
  this.socket.emit("play", invite);
}
API.prototype.cross_O = function(game_id, x, y, callback) {  
  this.once("cross_O", callback);
  this.socket.emit("cross_O", {
      game_id: game_id
    , x: x
    , y: y
  });
}
API.prototype.send_message = function(game_id, message, callback) {
  this.once("send_message", callback);  
  this.socket.emit("send_message", {game_id: game_id, message: message});
}
var create_error = function(event, err) {
  return {
      event: event
    , ok: false
    , is_error: true
    , error: err
  }
}