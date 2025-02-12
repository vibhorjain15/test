angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.project_tags',
    url: '/project_tags'
    controller: 'FirmSettingsProjectTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/project_tags/template.html'
    hidden_from: ['securityAdmin']