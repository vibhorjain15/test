angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.document_type',
    url: '/document_type'
    templateUrl: 'monitor/document_type/template.html'
    controller: 'MonitorDocumentTypesController'
    controllerAs: 'vm'
