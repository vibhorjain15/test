angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.analyze',
    url: '/analyze'
    abstract: true
    template: '<ui-view/>'
    accessible_to: [
      'InstitutionalSubscription'
      'ProductiveSubscription'
    ]
