var is_game_over = require('../library/files/gamesstat').is_game_over

/**
 * @ignore
 */
exports.setUp = function(callback) {
  callback();
}

/**
 * 
 *
 * @ignore
 */
exports.tearDown = function(callback) {
  callback();
}

exports['Should verify that board algorith is correct'] = function(test) {
  var board = [
    [,,,], [,,,], [,,,], [,,,]
  ];

  test.equal(false, is_game_over(board, 2, 2, 'x'));

  board = [
    ['x',,,], ['x',,,], ['x',,,], ['x',,,]
  ];

  test.equal(true, is_game_over(board, 0, 0, 'x'));

  board = [
    ['x','x','x','x'], [,,,], [,,,], [,,,]
  ];

  test.equal(true, is_game_over(board, 0, 0, 'x'));

  board = [
    ['x',,,], [,'x',,], [,,'x',], [,,,'x']
  ];

  test.equal(true, is_game_over(board, 0, 0, 'x'));

  board = [
    [,,,'x'], [,,'x',], [,'x',,], ['x',,,]
  ];

  test.equal(true, is_game_over(board, 0, 0, 'x'));

  test.done();
}
