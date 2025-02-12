angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.documents.list',
    url: '/list?status&q'
    templateUrl: 'diligence/project/documents/list/template.html'
    controller: 'ProjectDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.documents.list',
    url: '/list?status&q'
    templateUrl: 'diligence/project/documents/list/template.html'
    controller: 'ProjectDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.documents.list',
    url: '/list?status&q'
    templateUrl: 'diligence/project/documents/list/template.html'
    controller: 'ProjectDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.documents.list',
    url: '/list?status&q'
    templateUrl: 'diligence/project/documents/list/template.html'
    controller: 'ProjectDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.documents.list',
    url: '/list?status&q'
    templateUrl: 'diligence/project/documents/list/template.html'
    controller: 'ProjectDocumentsListController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.strategies.funds.vehicles.project.documents.list',
    url: '/list?status&q'
    templateUrl: 'diligence/project/documents/list/template.html'
    controller: 'ProjectDocumentsListController'
    controllerAs: 'vm'