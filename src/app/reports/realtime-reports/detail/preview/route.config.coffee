angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.detail.preview',
    url: '/preview'
    templateUrl: 'reports/realtime-reports/detail/preview/template.html'
    controller: 'RealtimeReportsDetailPreviewController'
    controllerAs: 'vm'
