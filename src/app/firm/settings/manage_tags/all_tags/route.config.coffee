angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.all_tags',
    url: '/all_tags'
    controller: 'FirmSettingsAllTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/all_tags/template.html'
    hidden_from: ['securityAdmin']
