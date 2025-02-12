angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.integrations',
    url: '/integrations'
    template: '<ui-view />'
    abstract: true
    hidden_from: ['securityAdmin']