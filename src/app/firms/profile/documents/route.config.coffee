angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.documents',
    url: '/documents'
    templateUrl: 'firms/profile/documents/template.html'
    controller: 'FirmsProfileDocumentsController'
    controllerAs: 'vm'

