angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.document_tags',
    url: '/document_tags'
    controller: 'FirmSettingsDocumentTagsController'
    controllerAs: 'vm'
    templateUrl: 'firm/settings/document_tags/template.html'
    hidden_from: ['securityAdmin']
