angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.discover',
    url: '/discover'
    abstract: true
    templateUrl: 'discover/template.html'
    title: 'Discover'
    accessible_to: [
      'InstitutionalSubscription'
    ]
    hidden_from: ['ProductiveSubscription']
