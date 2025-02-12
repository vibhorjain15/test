angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.advanced_reporting',
    url: '/advanced_reporting'
    template: '<ng2-advanced-reporting></ng2-advanced-reporting>'
    hidden_from: ['securityAdmin']