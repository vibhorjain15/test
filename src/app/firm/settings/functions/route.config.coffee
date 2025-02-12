angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.functions',
    url: '/functions'
    templateUrl: 'firm/settings/functions/template.html'
    controller: 'FirmSettingsFunctionsController'
    controllerAs: 'vm'
