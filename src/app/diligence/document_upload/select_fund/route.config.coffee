angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.document_upload.select_fund',
    url: '/select_fund'
    templateUrl: 'diligence/document_upload/select_fund/template.html'
    controller: 'DiligenceDocumentUploadSelectFundController'
    controllerAs: 'vm'
