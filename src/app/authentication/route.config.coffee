angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication',
    abstract: true
    onEnter: ($rootScope) ->
      if !$rootScope.app_initialized
        $rootScope.$emit 'app_initialized'
