angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'strategies/profile/recommendations/template.html'
    controller: 'StrategyProfileRecommendationsController'
    controllerAs: 'vm'
angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'strategies/profile/recommendations/template.html'
    controller: 'StrategyProfileRecommendationsController'
    controllerAs: 'vm'
