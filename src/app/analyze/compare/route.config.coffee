angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.analyze.compare',
    url: '/compare'
    abstract: true
    template: '<ui-view/>'
    accessible_to: [
      'InstitutionalSubscription'
      'ProductiveSubscription'
    ]
    hidden_from: ['securityAdmin','manager']
