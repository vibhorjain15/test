angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.content.document.detail',
    url: '/detail'
    templateUrl: 'content/document/detail/template.html'
    controller: 'DocumentDetailController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.document.detail',
    url: '/detail'
    onEnter: (Utils,$state)=>
      $state.go 'app.content.document.detail', {documentId: $state.toParams.documentId}