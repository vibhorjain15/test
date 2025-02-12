angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.my_firm.profile',
    url: '/profile'
    template: '<ng2-entity-tabs></ng2-entity-tabs>' 
