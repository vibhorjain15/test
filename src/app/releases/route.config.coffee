angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.releases',
    url: '/releases'
    abstract: true
    template: '<ui-view />'
