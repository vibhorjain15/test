angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.documents',
    url: '/documents'
    templateUrl: 'funds/profile/documents/template.html'
    controller: 'FundsProfileDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.documents',
    url: '/documents'
    templateUrl: 'funds/profile/documents/template.html'
    controller: 'FundsProfileDocumentsController'
    controllerAs: 'vm'

