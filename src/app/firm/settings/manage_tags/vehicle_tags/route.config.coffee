angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.vehicle_tags',
    url: '/vehicle_tags'
    controller: 'FirmSettingsVehicleTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/vehicle_tags/template.html'
    hidden_from: ['securityAdmin']