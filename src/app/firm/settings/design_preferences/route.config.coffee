angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.design_preferences',
    url: '/design_preferences'
    templateUrl: 'firm/settings/design_preferences/template.html'
    controller: 'FirmSettingsDesignPreferencesController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
