angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.template',
    url: '/template/:templateId?request'
    abstract: true
    templateUrl: 'diligence/template/template.html'
    controller: 'DiligenceTemplateController'
    controllerAs: 'vm'
    onExit: ($rootScope) ->
      $rootScope.title = null
