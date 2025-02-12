angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.template.categories.subcategories',
    url: '/:categoryId/subcategories'
    templateUrl: 'diligence/template/categories/subcategories/template.html'
    controller: 'DiligenceTemplateSubcategoriesController'
    controllerAs: 'vm'
