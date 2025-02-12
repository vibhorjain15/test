angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.password',
    url: '/password'
    templateUrl: 'firm/settings/password/template.html'
    controller: 'FirmSettingsPasswordController'
    controllerAs: 'vm'
    hidden_from: ['businessAdmin']
