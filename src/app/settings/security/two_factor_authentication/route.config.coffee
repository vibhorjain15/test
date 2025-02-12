angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security.two_factor_authentication',
    abstract: true
    url: '/two_factor_authentication'
    template: '<ui-view/>'
