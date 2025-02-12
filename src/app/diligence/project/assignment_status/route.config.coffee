angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.assignment_status',
    url: '/assignment_status'
    templateUrl: 'diligence/project/assignment_status/template.html'
    controller: 'ProjectAssignmentStatusController'
    controllerAs: 'vm'
    hidden_from: ['investor']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.assignment_status',
    url: '/assignment_status'
    templateUrl: 'diligence/project/assignment_status/template.html'
    controller: 'ProjectAssignmentStatusController'
    controllerAs: 'vm'
    hidden_from: ['investor']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.assignment_status',
    url: '/assignment_status'
    templateUrl: 'diligence/project/assignment_status/template.html'
    controller: 'ProjectAssignmentStatusController'
    controllerAs: 'vm'
    hidden_from: ['investor']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.assignment_status',
    url: '/assignment_status'
    templateUrl: 'diligence/project/assignment_status/template.html'
    controller: 'ProjectAssignmentStatusController'
    controllerAs: 'vm'
    hidden_from: ['investor']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.assignment_status',
    url: '/assignment_status'
    templateUrl: 'diligence/project/assignment_status/template.html'
    controller: 'ProjectAssignmentStatusController'
    controllerAs: 'vm'
    hidden_from: ['investor']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.assignment_status',
    url: '/assignment_status'
    templateUrl: 'diligence/project/assignment_status/template.html'
    controller: 'ProjectAssignmentStatusController'
    controllerAs: 'vm'
    hidden_from: ['investor']
