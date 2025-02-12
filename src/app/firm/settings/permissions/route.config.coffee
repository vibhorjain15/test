angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.permissions',
    url: '/permissions'
    templateUrl: 'firm/settings/permissions/template.html'
    controller: 'FirmSettingsPermissionsController'
    controllerAs: 'vm'
