angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.contacts',
    url: '/contacts'
    templateUrl: 'strategies/profile/contacts/template.html'
    controller: 'StrategyProfileContactsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.contacts',
    url: '/contacts'
    templateUrl: 'strategies/profile/contacts/template.html'
    controller: 'StrategyProfileContactsController'
    controllerAs: 'vm'
