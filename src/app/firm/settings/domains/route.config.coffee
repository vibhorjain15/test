angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.domains',
    url: '/domains'
    templateUrl: 'firm/settings/domains/template.html'
    controller: 'FirmSettingsDomainsController'
    controllerAs: 'vm'
    hidden_from: ['businessAdmin']
