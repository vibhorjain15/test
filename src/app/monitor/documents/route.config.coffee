angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.documents',
    url: '/documents'
    templateUrl: 'monitor/documents/template.html'
    controller: 'MonitorDocumentsController'
    controllerAs: 'vm'
