angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.analyze.scorecard',
    url: '/scorecard'
    templateUrl: 'analyze/scorecard/template.html'
    controller: 'ScorecardController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','manager']
