angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.detail.edit',
    url: '/edit'
    templateUrl: 'reports/realtime-reports/detail/edit/template.html'
    controller: 'RealtimeReportsDetailEditController'
    controllerAs: 'vm'
