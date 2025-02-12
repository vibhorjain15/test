angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.integrations.api',
    url: '/api'
    templateUrl: 'firm/settings/integrations/api/template.html'
    controller: 'FirmSettingsIntegrationsAPIController'
    controllerAs: 'vm'
