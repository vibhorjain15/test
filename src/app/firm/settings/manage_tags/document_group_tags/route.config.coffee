angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.document_group_tags',
    url: '/document_group_tags'
    controller: 'FirmSettingsDocumentGroupTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/manage_tags/document_group_tags/template.html'
    hidden_from: ['securityAdmin']