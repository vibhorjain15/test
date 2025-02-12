angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.investment_rating',
    url: '/investment_rating'
    template: '<ui-view />'
    abstract: true
    hidden_from: ['securityAdmin', 'manager', 'FreeSubscription']
