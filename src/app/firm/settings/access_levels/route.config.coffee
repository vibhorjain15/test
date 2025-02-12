angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.access_levels',
    url: '/access_levels'
    templateUrl: 'firm/settings/access_levels/template.html'
    controller: 'FirmSettingsAccessLevelsController'
    controllerAs: 'vm'
