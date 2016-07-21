var emit_message = require("./shared").emit_message
  , is_authenticated = require("./shared").is_authenticated
  , locate_connection_with_session = require("./shared").locate_connection_with_session
  , emit_error = require("./shared").emit_error;

var user = require('../models/user')
  , gamer = require('../models/gamer')
  , game = require('../models/game');
var usersstat = function(io, socket, session_store, db) {
  var calling_method_name = "usersstat";
  return function(data) {
 if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
    var clients = io.sockets.clients();
    var sids = [];
    for(var i = 0; i < clients.length; i++) {
      if(clients[i].handshake.sessionID != socket.handshake.sessionID) {
        sids.push(clients[i].handshake.sessionID);
      }
    }
    gamer(db).findAllGamersBySids(sids, function(err, gamers) {
      if(err) return emit_error(calling_method_name, err.message, socket);    
      gamer(db).updateGamersUpdatedDateBySids(sids, function(err, result) {
        if(err) return emit_error(calling_method_name, err.message, socket);    
        emit_message(calling_method_name, {
            ok: true
          , result: gamers
        }, socket);    
      });
    });    
  } 
}


var request_call = function(io, socket, session_store, db) {
  var calling_method_name = "request_call";
  var event_name          = "game_invite";
  return function(data) {
    if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
    var connection = locate_connection_with_session(io, data.sid);
    if(connection == null) return emit_error(calling_method_name, "Invited user is no longer available", socket);
    var our_sid = socket.handshake.sessionID;
    gamer(db).findGamerBySid(our_sid, function(err, gamer_doc) {
      if(err) return emit_error(calling_method_name, err.message, socket);    
      emit_message(event_name, {
          ok: true
        , result: {
            sid: our_sid
          , gamer: gamer_doc          
        }
      }, connection);    
    });
  }
}

var reject= function(io, socket, session_store, db) {
 var calling_method_name = "reject";
  var event_name          = "request_call";

  return function(data) {
   
    if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
    var our_sid = socket.handshake.sessionID;
    var connection = locate_connection_with_session(io, data.sid);
    if(connection == null) return emit_error(calling_method_name, "User is no longer available", socket);
    emit_error(request_call, "User declined game", connection);
  }
}

var play = function(io, socket, session_store, db) {
  var calling_method_name = "play";
  var event_name          = "request_call";
  return function(data) {
    if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
    var our_sid = socket.handshake.sessionID;
    var connection = locate_connection_with_session(io, data.sid);
    if(connection == null) return emit_error(calling_method_name, "User is no longer available", socket);    
    gamer(db).findAllGamersBySids([our_sid, data.sid], function(err, players) {
      if(err || players.length != 2) {
        emit_error(event_name, "Failed to locate players for game acceptance", connection);
        return emit_error(calling_method_name, "Failed to locate players for game acceptance", socket);
      }
      var p1 = players[0];
      var p2 = players[1];
      game(db).create_game(p1.sid, p1.user_name, p1.full_name, p2.sid, p2.user_name, p2.full_name, function(err, game_doc) {
	  if(err) {
          emit_error(event_name, "Failed to create a new game", connection);
          return emit_error(calling_method_name, "Failed to create a new game", socket);
        }
        emit_message(event_name, { ok: true, result: game_doc }, connection);
        emit_message(calling_method_name, { ok: true, result: game_doc }, socket);
      });
    });
  }
}

var cross_O = function(io, socket, session_store, db) {
  var calling_method_name      = "cross_O";
  var event_name_move          = "game_move";
  var event_name_game_over     = "game_over";
  return function(data) {
    if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
    var our_sid = socket.handshake.sessionID;
    game(db).find_game(data.game_id, function(err, game_doc) {
      if(err) return emit_error(calling_method_name, "Could not find the game", socket);
      var board = game_doc.board;
      var marker = game_doc.starting_player == our_sid ? "x" : "o";
      var other_player_sid = game_doc.player1_sid == our_sid ? game_doc.player2_sid : game_doc.player1_sid;

  
      if(board[data.y][data.x] == "x" || board[data.y][data.x] == "o") 
        return emit_error(calling_method_name, "Cell already selected", socket);;

      // Mark the cell with our marker
      board[data.y][data.x] = marker;

      // Attempt to update the board
      game(db).update_board(our_sid, data.game_id, other_player_sid, board, function(err, result) {
        // If we have an error it was not our turn
        if(err) return emit_error(calling_method_name, "Not your turn", socket);
        var connection = locate_connection_with_session(io, other_player_sid);
        if(connection == null) return emit_error(calling_method_name, "User is no longer available", socket);
        emit_message(calling_method_name, { ok: true
          , result: {y: data.y, x:data.x, marker: marker} }
          , socket);        
        emit_message(event_name_move, { ok: true
          , result: {y: data.y, x:data.x, marker: marker} }
          , connection);

        // If there was no winner this turn
        if(is_game_over(board, data.y, data.x, marker) == false) {
          // If there are still fields left on the board, let's keep playing
          if(!is_game_draw(board)) return;      
          emit_message(event_name_game_over, { ok: true, result: {draw:true} }, socket);        
          return emit_message(event_name_game_over, { ok: true, result: {draw:true} }, connection);          
        }
        emit_message(event_name_game_over, { ok: true, result: {winner: our_sid} }, socket);        
        emit_message(event_name_game_over, { ok: true, result: {winner: our_sid} }, connection);
      })
    });
  }
}

var is_game_draw = function(board) {
  for(var i = 0; i < board.length; i++) {
    for(var j = 0; j < board[i].length; j++) {
      if(board[i][j] == 0) {
        return false;
      }
    }
  }

  return true;
}


var is_game_over = function(board, y, x, marker) {
  var found_vertical = true;
  var found_horizontal = true;
  var found_diagonal = true;
  for(var i = 0; i < board[0].length; i++) {
    if(board[y][i] != marker) {
      found_horizontal = false;
      break;
    }
  }
  if(found_horizontal) return true;

  // x and y = 0 to y = n
  for(var i = 0; i < board.length; i++) {
    if(board[i][x] != marker) {
      found_vertical = false;
      break;
    }
  }
  if(found_vertical) return true;

  for(var i = 0, j = 0; i < board[0].length; i++) {
    if(board[j++][i] != marker) {
      found_diagonal = false;
      break;
    }
  }

  if(found_diagonal) return true;
  found_diagonal = true;

  for(var i = board[0].length - 1, j = 0; i > 0 ; i--) {
    if(board[j++][i] != marker) {
      found_diagonal = false;
      break;
    }
  }
  return found_diagonal;
}

exports.usersstat = usersstat;
exports.request_call              = request_call;
exports.play               		  = play;
exports.reject                    = reject;
exports.cross_O                   = cross_O;
exports.is_game_over              = is_game_over;
