angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.review_definitions',
    url: '/review_definitions'
    abstract: true
    template: '<ui-view />'
    hidden_from: ['securityAdmin']
