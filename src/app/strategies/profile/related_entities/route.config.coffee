angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.related_entities',
    url: '/related_entities'
    templateUrl: 'strategies/profile/related_entities/template.html'
    controller: 'StrategyProfileEntitiesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.related_entities',
    url: '/related_entities'
    templateUrl: 'strategies/profile/related_entities/template.html'
    controller: 'StrategyProfileEntitiesController'
    controllerAs: 'vm'
