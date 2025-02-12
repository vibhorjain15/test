angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.projects',
    url: '/projects'
    abstract: true
    templateUrl: 'diligence/projects/template.html'
    controller: 'DiligenceProjectsController'
    controllerAs: 'vm'
