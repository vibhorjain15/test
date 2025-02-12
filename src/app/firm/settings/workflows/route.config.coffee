angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.workflows',
    url: '/workflows'
    abstract: true
    template: '<ui-view />'
    hidden_from: ['securityAdmin']
