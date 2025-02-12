angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.sso_profile',
    url: '/sso-profile'
    templateUrl: 'firm/settings/sso_profile/template.html'
    controller: 'FirmSettingsSsoController'
    controllerAs: 'vm'
    hidden_from: ['businessAdmin']
