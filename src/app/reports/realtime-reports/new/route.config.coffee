angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.new',
    url: '/new'
    templateUrl: 'reports/realtime-reports/new/template.html'
    controller: 'RealtimeReportsNewController'
    controllerAs: 'vm'
