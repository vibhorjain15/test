angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.documents.list',
    url: '/list?status&q'
    templateUrl: 'funds/profile/documents/list/template.html'
    controller: 'FundsDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.documents.list',
    url: '/list?status&q&tab&view&hide_empty'
    templateUrl: 'funds/profile/documents/list/template.html'
    controller: 'FundsDocumentsListController'
    controllerAs: 'vm'
    params: {receivedDocumentsNewCount: 0}
