angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.releases',
    url: '/releases'
    abstract: true
    template: '<ui-view />'
    accessible_to: ['DiligenceVaultUser']
