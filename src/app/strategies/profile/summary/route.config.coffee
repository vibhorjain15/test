angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.summary',
    url: '/summary'
    templateUrl: 'strategies/profile/summary/template.html'
    controller: 'StrategyProfileSummaryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.summary',
    url: '/summary'
    templateUrl: 'strategies/profile/summary/template.html'
    controller: 'StrategyProfileSummaryController'
    controllerAs: 'vm'
