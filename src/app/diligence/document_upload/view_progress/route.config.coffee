angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.document_upload.view_progress',
    url: '/view_progress?request'
    templateUrl: 'diligence/document_upload/view_progress/template.html'
    controller: 'DiligenceDocumentViewProgressController'
    controllerAs: 'vm'
