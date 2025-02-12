angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.integrations.outlook',
    url: '/outlook'
    templateUrl: 'firm/settings/integrations/outlook/template.html'
    controller: 'FirmSettingsOutlookIntegrationController'
    controllerAs: 'vm'
