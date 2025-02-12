angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.analyze.templates',
    url: '/templates'
    templateUrl: 'analyze/templates/template.html'
    controller: 'AnalyzeTemplatesController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','manager']
