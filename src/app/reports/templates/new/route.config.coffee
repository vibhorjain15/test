angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates.new',
    url: '/new'
    templateUrl: 'reports/templates/new/template.html'
    controller: 'ReportsTemplatesNewController'
    controllerAs: 'vm'
