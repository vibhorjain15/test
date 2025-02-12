angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates.list',
    url: '/list'
    templateUrl: 'reports/templates/list/template.html'
    controller: 'ReportTemplatesListController'
    controllerAs: 'vm'
