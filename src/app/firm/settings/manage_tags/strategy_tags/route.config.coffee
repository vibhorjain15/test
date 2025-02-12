angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.strategy_tags',
    url: '/strategy_tags'
    controller: 'FirmSettingsStrategyTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/strategy_tags/template.html'
    hidden_from: ['securityAdmin']