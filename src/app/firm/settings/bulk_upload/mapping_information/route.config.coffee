angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.bulk_upload.mapping_information',
    url: '/mapping_information'
    templateUrl: 'firm/settings/bulk_upload/mapping_information/template.html'
    controller: 'BulkActionsMappingInformationController'
    controllerAs: 'vm'
