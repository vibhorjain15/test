angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.ip_configurations',
    url: '/ip_configurations'
    templateUrl: 'firm/settings/ip_configurations/template.html'
    controller: 'FirmSettingsIpConfigurationController'
    controllerAs: 'vm'
    hidden_from: ['businessAdmin']
