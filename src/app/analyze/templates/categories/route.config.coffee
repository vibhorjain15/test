angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.analyze.templates.categories',
    url: '/:templateId/categories?tagId&start_date&end_date&selectedRange&range'
    templateUrl: 'analyze/templates/categories/template.html'
    controller: 'AnalyzeTemplateCategoriesController'
    controllerAs: 'vm'
