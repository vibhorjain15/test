angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.preferences',
    url: '/preferences'
    templateUrl: 'firm/settings/preferences/template.html'
    controller: 'FirmSettingsPreferencesController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
