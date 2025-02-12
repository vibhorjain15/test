 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.questionnaire.category',
     url: '/category/:categoryId/:isMultiple'
     templateUrl: 'form_adv/firm/questionnaire/category/template.html'
     controller: 'FormADVQuestionnaireCategoryController'
     controllerAs: 'vm'
