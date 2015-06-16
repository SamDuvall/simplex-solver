module.exports = function(app) {
  app.directive({
    uiCheckbox: require('./uiCheckbox'),
    uiDropdown: require('./uiDropdown'),
    uiPopup: require('./uiPopup')
  });
}
