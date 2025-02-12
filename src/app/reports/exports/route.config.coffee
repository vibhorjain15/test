angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.exports',
    url: '/exports'
    templateUrl: 'reports/exports/template.html'
    controller: 'ExportsController'
    controllerAs: 'vm'
