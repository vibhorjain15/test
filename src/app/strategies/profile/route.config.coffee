angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile',
    url: '/profile'
    templateUrl: 'strategies/profile/template.html'
    controller: 'StrategyProfileController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile',
    url: '/profile'
    template: '<ng2-entity-tabs></ng2-entity-tabs>'