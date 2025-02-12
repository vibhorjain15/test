angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.documents',
    url: '/documents'
    abstract: true
    templateUrl: 'diligence/project/documents/template.html'
    controller: 'ProjectDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.documents',
    url: '/documents'
    abstract: true
    templateUrl: 'diligence/project/documents/template.html'
    controller: 'ProjectDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.documents',
    url: '/documents'
    abstract: true
    templateUrl: 'diligence/project/documents/template.html'
    controller: 'ProjectDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.documents',
    url: '/documents'
    abstract: true
    templateUrl: 'diligence/project/documents/template.html'
    controller: 'ProjectDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.documents',
    url: '/documents'
    abstract: true
    templateUrl: 'diligence/project/documents/template.html'
    controller: 'ProjectDocumentsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.documents',
    url: '/documents'
    abstract: true
    templateUrl: 'diligence/project/documents/template.html'
    controller: 'ProjectDocumentsController'
    controllerAs: 'vm'