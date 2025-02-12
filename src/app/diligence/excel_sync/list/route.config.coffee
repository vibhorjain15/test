angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.excel_sync.list',
    url: '/list?sync_type'
    templateUrl: 'diligence/excel_sync/list/template.html'
    controller: 'ExcelSyncListController'
    controllerAs: 'vm'
