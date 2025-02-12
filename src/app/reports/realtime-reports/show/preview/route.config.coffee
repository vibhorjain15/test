angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.show.preview',
    url: '/preview'
    templateUrl: 'reports/realtime-reports/show/preview/template.html'
    controller: 'RealtimeReportsListPreviewController'
    controllerAs: 'vm'
