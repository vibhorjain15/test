angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.address',
    url: '/address'
    templateUrl: 'strategies/profile/address/template.html'
    controller: 'StrategyProfileAddressController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.address',
    url: '/address'
    templateUrl: 'strategies/profile/address/template.html'
    controller: 'StrategyProfileAddressController'
    controllerAs: 'vm'
