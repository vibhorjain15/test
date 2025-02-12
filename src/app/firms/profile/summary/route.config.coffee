angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.summary',
    url: '/summary'
    templateUrl: 'firms/profile/summary/template.html'
    controller: 'FirmProfileSummaryController'
    controllerAs: 'vm'
