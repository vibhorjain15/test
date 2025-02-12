angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile',
    url: '/profile'
    template: '<ng2-entity-tabs></ng2-entity-tabs>' 