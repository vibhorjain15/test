angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.bulk_upload.user_entities',
    url: '/user_entities'
    templateUrl: 'firm/settings/bulk_upload/user_entities/template.html'
    controller: 'BulkActionsController'
    controllerAs: 'vm'
