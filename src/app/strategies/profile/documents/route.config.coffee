angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.documents',
    url: '/documents'
    templateUrl: 'strategies/profile/documents/template.html'
    controller: 'StrategiesProfileDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.documents',
    url: '/documents'
    templateUrl: 'strategies/profile/documents/template.html'
    controller: 'StrategiesProfileDocumentsController'
    controllerAs: 'vm'

