angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.analyze.templates.categories.responses',
    url: '/:categoryId/responses'
    templateUrl: 'analyze/templates/categories/responses/template.html'
    controller: 'AnalyzeTemplateCategoryResponsesController'
    controllerAs: 'vm'
