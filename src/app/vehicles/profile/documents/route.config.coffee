angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile.documents',
    url: '/documents'
    templateUrl: 'vehicles/profile/documents/template.html'
    controller: 'VehiclesProfileDocumentsController'
    controllerAs: 'vm'
    hidden_from: [ 'FreeSubscription' ]

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile.documents',
    url: '/documents'
    templateUrl: 'vehicles/profile/documents/template.html'
    controller: 'VehiclesProfileDocumentsController'
    controllerAs: 'vm'
    hidden_from: [ 'FreeSubscription' ]
