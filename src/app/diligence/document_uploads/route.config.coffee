angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.document_uploads',
    url: '/document_uploads'
    templateUrl: 'diligence/document_uploads/template.html'
    controller: 'DiligenceDocumentUploadsController'
    controllerAs: 'vm'
