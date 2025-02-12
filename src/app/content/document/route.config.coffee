angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.content.document',
    url: '/document/:documentId'
    abstract: true
    template: '<ui-view />'


angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.document',
    url: '/document/:documentId'
    abstract: true
    onEnter: (Utils,$state)=>
      $state.go 'app.content.document.detail',{documentId: $state.toParams.documentId} 
      



