angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.document_upload.detail',
    url: '/detail?request'
    templateUrl: 'diligence/document_upload/detail/template.html'
    controller: 'DiligenceDocumentUploadDetailController'
    controllerAs: 'vm'
