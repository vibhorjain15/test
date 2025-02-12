angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security',
    url: '/security'
    abstract: true
    template: '<ui-view />'
