angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.roles',
    url: '/roles'
    templateUrl: 'diligence/project/roles/template.html'
    controller: 'ProjectRolesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.roles',
    url: '/roles'
    templateUrl: 'diligence/project/roles/template.html'
    controller: 'ProjectRolesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.roles',
    url: '/roles'
    templateUrl: 'diligence/project/roles/template.html'
    controller: 'ProjectRolesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.roles',
    url: '/roles'
    templateUrl: 'diligence/project/roles/template.html'
    controller: 'ProjectRolesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.roles',
    url: '/roles'
    templateUrl: 'diligence/project/roles/template.html'
    controller: 'ProjectRolesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.roles',
    url: '/roles'
    templateUrl: 'diligence/project/roles/template.html'
    controller: 'ProjectRolesController'
    controllerAs: 'vm'