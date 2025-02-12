angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm',
    url: '/firm'
    template: '<ui-view />'
