angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.export_preferences',
    url: '/export_preferences'
    templateUrl: 'firm/settings/export_preferences/template.html'
    controller: 'FirmSettingsExportPreferencesController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
