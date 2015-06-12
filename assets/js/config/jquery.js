$.ajaxSetup({
  cache: false, // Don't cache requests
  dataType: 'json'
});

$.fn.serializeObject = function() {
  var data = $(this).serialize();
  var array = data.split('&');
  var object = {};
  array.forEach(function(variable) {
    var pair = variable.split('=');
    object[pair[0]] = pair[1];
  });
  return object;
}
