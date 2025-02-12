angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.workflow_automation',
    url: '/workflow_automation'
    abstract: true
    template: '<ui-view />'
    hidden_from: ['securityAdmin']
