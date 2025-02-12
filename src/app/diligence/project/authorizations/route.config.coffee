angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.authorizations',
    url: '/authorizations'
    templateUrl: 'diligence/project/authorizations/template.html'
    controller: 'ProjectAuthorizationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.authorizations',
    url: '/authorizations'
    templateUrl: 'diligence/project/authorizations/template.html'
    controller: 'ProjectAuthorizationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.authorizations',
    url: '/authorizations'
    templateUrl: 'diligence/project/authorizations/template.html'
    controller: 'ProjectAuthorizationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.authorizations',
    url: '/authorizations'
    templateUrl: 'diligence/project/authorizations/template.html'
    controller: 'ProjectAuthorizationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.authorizations',
    url: '/authorizations'
    templateUrl: 'diligence/project/authorizations/template.html'
    controller: 'ProjectAuthorizationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.authorizations',
    url: '/authorizations'
    templateUrl: 'diligence/project/authorizations/template.html'
    controller: 'ProjectAuthorizationsController'
    controllerAs: 'vm'