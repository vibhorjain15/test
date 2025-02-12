angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.activity',
    url: '/activity'
    templateUrl: 'firm/settings/activity/template.html'
    controller: 'FirmSettingsActivityController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
