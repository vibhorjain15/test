angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.excel_sync.detail',
    url: '/detail?sync_type&?Id'
    templateUrl: 'diligence/excel_sync/detail/template.html'
    controller: 'ExcelSyncDetailController'
    controllerAs: 'vm'
