angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.email_templates',
    url: '/email-templates'
    templateUrl: 'firm/settings/email_templates/template.html'
    controller: 'FirmSettingsEmailTemplatesController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
