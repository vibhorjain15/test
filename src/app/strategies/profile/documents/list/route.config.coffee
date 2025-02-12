angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.strategies.profile.documents.list',
    url: '/list?status&q'
    templateUrl: 'strategies/profile/documents/list/template.html'
    controller: 'StrategiesDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.profile.documents.list',
    url: '/list?status&q&tab&view&hide_empty'
    templateUrl: 'strategies/profile/documents/list/template.html'
    controller: 'StrategiesDocumentsListController'
    controllerAs: 'vm'
    params: {receivedDocumentsNewCount: 0}
