angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.document_classifications',
    url: '/document_classifications'
    templateUrl: 'firm/settings/document_classifications/template.html'
    controller: 'FirmSettingsDocClassificationController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
