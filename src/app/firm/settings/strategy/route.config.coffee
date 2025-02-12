angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.strategy',
    url: '/strategy'
    controller: 'FirmSettingsStrategyController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/strategy/template.html'
    hidden_from: ['securityAdmin']
