angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.associated_entities',
    url: '/associated_entities'
    templateUrl: 'strategies/profile/associated_entities/template.html'
    controller: 'StrategyAssociatedEntitiesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.associated_entities',
    url: '/associated_entities'
    templateUrl: 'strategies/profile/associated_entities/template.html'
    controller: 'StrategyAssociatedEntitiesController'
    controllerAs: 'vm'
