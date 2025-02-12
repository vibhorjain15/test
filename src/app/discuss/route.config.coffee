angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.discuss',
    url: '/discuss'
    abstract: true
    accessible_to: [ 'InstitutionalSubscription' ]
    hidden_from: ['ProductiveSubscription']
    template: '<ui-view/>'
