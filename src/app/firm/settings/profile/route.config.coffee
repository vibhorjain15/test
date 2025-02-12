angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.profile',
    url: '/profile'
    templateUrl: 'firm/settings/profile/template.html'
    controller: 'FirmSettingsProfileController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
