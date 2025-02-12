angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.share',
    url: '/share'
    templateUrl: 'diligence/project/share/template.html'
    controller: 'ProjectShareController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.share',
    url: '/share'
    templateUrl: 'diligence/project/share/template.html'
    controller: 'ProjectShareController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.share',
    url: '/share'
    templateUrl: 'diligence/project/share/template.html'
    controller: 'ProjectShareController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.share',
    url: '/share'
    templateUrl: 'diligence/project/share/template.html'
    controller: 'ProjectShareController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.share',
    url: '/share'
    templateUrl: 'diligence/project/share/template.html'
    controller: 'ProjectShareController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.share',
    url: '/share'
    templateUrl: 'diligence/project/share/template.html'
    controller: 'ProjectShareController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null
