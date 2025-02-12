angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates.detail.edit',
    url: '/edit'
    templateUrl: 'reports/templates/detail/edit/template.html'
    controller: 'ReportsTemplatesDetailEditController'
    controllerAs: 'vm'
