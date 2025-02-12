angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.template.categories.subcategories.questions',
    url: '/:subcategoryId/questions'
    templateUrl: 'diligence/template/categories/subcategories/questions/template.html'
    controller: 'DiligenceTemplateSubcategoryQuestionsController'
    controllerAs: 'vm'
