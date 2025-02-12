angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.disclaimers',
    url: '/disclaimers'
    templateUrl: 'firm/settings/disclaimers/template.html'
    controller: 'FirmSettingsDisclaimersController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','investor']
