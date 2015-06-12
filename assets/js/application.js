require('./config/date');
require('./config/jquery');
require('./config/string');
require('../../app');

$(window).bind("load", function() {
   $('body').addClass('loaded');
});
