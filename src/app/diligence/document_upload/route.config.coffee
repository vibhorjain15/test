angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.document_upload',
    url: '/document_upload/:documentUploadId'
    abstract: true
    template: '<ui-view/>'
