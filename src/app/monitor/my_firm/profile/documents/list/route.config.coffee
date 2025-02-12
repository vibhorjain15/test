angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.my_firm.profile.documents.list',
    url: '/list?status&q&tab&view&hide_empty'
    templateUrl: 'monitor/my_firm/profile/documents/list/template.html'
    controller: 'MyFirmDocumentsListController'
    controllerAs: 'vm'
    params: {receivedDocumentsNewCount: 0}
