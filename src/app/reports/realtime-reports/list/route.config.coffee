angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.list',
    url: '/list'
    templateUrl: 'reports/realtime-reports/list/template.html'
    controller: 'RealtimeReportsListController'
    controllerAs: 'vm'
    hidden_from: ['manager']
