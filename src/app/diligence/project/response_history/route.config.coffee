angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.response_history',
    url: '/response_history'
    templateUrl: 'diligence/project/response_history/template.html'
    controller: 'ProjectResponseHistoryController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.response_history',
    url: '/response_history'
    templateUrl: 'diligence/project/response_history/template.html'
    controller: 'ProjectResponseHistoryController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.response_history',
    url: '/response_history'
    templateUrl: 'diligence/project/response_history/template.html'
    controller: 'ProjectResponseHistoryController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.response_history',
    url: '/response_history'
    templateUrl: 'diligence/project/response_history/template.html'
    controller: 'ProjectResponseHistoryController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.response_history',
    url: '/response_history'
    templateUrl: 'diligence/project/response_history/template.html'
    controller: 'ProjectResponseHistoryController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.response_history',
    url: '/response_history'
    templateUrl: 'diligence/project/response_history/template.html'
    controller: 'ProjectResponseHistoryController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null