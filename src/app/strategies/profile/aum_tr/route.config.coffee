angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.aum_tr',
    url: '/aum_tr'
    templateUrl: 'strategies/profile/aum_tr/template.html'
    controller: 'StrategyProfileAUMTRController'
    controllerAs: 'vm'
