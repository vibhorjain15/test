angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.new_report',
    url: '/new_report'
    templateUrl: 'reports/new_report/template.html'
    controller: 'NewReportController'
    controllerAs: 'vm'
