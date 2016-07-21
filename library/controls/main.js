var path = require('path');
var index = function() {
  return function(request, response) {
    var html = path.normalize(__dirname + '/../views/index.html');
    response.sendfile(html);
  }  
}

exports.index = index;