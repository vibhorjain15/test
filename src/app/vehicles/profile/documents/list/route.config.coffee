angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile.documents.list',
    url: '/list?status&q'
    templateUrl: 'vehicles/profile/documents/list/template.html'
    controller: 'VehiclesDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile.documents.list',
    url: '/list?status&q&tab&view&hide_empty'
    templateUrl: 'vehicles/profile/documents/list/template.html'
    controller: 'VehiclesDocumentsListController'
    controllerAs: 'vm'
    params: {receivedDocumentsNewCount: 0}
