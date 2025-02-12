angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.my_firm',
    url: '/my_firm'
    template: '<ui-view/>'
    hidden_from: ['investor']
