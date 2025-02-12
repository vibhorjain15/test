angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.documents.list',
    url: '/list?status&q&tab&view&hide_empty'
    templateUrl: 'firms/profile/documents/list/template.html'
    controller: 'FirmsDocumentsListController'
    controllerAs: 'vm'
    params: {receivedDocumentsNewCount: 0}
