angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings',
    url: '/settings'
    templateUrl: 'firm/settings/template.html'
    controller: 'FirmSettingsController'
    controllerAs: 'vm'
    abstract: true
    accessible_to: ['admin']
