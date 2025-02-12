angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.ddq',
    url: '/ddq'
    templateUrl: 'strategies/profile/ddq/template.html'
    controller: 'StrategyProfileDDQController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.ddq',
    url: '/ddq'
    templateUrl: 'strategies/profile/ddq/template.html'
    controller: 'StrategyProfileDDQController'
    controllerAs: 'vm'
