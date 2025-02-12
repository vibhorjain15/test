angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.contact_tags',
    url: '/contact_tags'
    controller: 'FirmSettingsContactTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/contact_tags/template.html'
    hidden_from: ['securityAdmin']