angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.template.categories',
    url: '/categories'
    params: {addNew: false, addNewSubcategory: false}
    templateUrl: 'diligence/template/categories/template.html'
    controller: 'DiligenceTemplateCategoriesController'
    controllerAs: 'vm'
