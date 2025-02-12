angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.integrations.export_import',
    url: '/export_import'
    templateUrl: 'firm/settings/integrations/export_import/template.html'
    controller: 'FirmSettingsExportOptionsController'
    controllerAs: 'vm'
