angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.print_preview',
    url: '/print_preview?status'
    templateUrl: 'diligence/project/print_preview/template.html'
    controller: 'ProjectPrintPreviewController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.print_preview',
    url: '/print_preview?status'
    templateUrl: 'diligence/project/print_preview/template.html'
    controller: 'ProjectPrintPreviewController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.print_preview',
    url: '/print_preview?status'
    templateUrl: 'diligence/project/print_preview/template.html'
    controller: 'ProjectPrintPreviewController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.print_preview',
    url: '/print_preview?status'
    templateUrl: 'diligence/project/print_preview/template.html'
    controller: 'ProjectPrintPreviewController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.print_preview',
    url: '/print_preview?status'
    templateUrl: 'diligence/project/print_preview/template.html'
    controller: 'ProjectPrintPreviewController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.print_preview',
    url: '/print_preview?status'
    templateUrl: 'diligence/project/print_preview/template.html'
    controller: 'ProjectPrintPreviewController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null