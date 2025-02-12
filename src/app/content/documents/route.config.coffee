angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.documents',
    url: '/documents?status&q&tab&view&date_range&hide_empty'
    template:'<ng2-documents-grid></ng2-documents-grid>'
    reloadOnSearch: false # Don't reload on query param change, if required pass { reload: true }
    params: {receivedDocumentsNewCount: 0}
