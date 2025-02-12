###
        <questionnaire data-ng-if="!vm.diligence.isReadOnly"
                       diligence="vm.diligence"></questionnaire>
###

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.questionnaire.category',
    url: '/category/:categoryId'
    templateUrl: 'diligence/project/questionnaire/category/template.html'
    controller: 'ProjectQuestionnaireCategoryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.questionnaire.category',
    url: '/category/:categoryId'
    templateUrl: 'diligence/project/questionnaire/category/template.html'
    controller: 'ProjectQuestionnaireCategoryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.questionnaire.category',
    url: '/category/:categoryId'
    templateUrl: 'diligence/project/questionnaire/category/template.html'
    controller: 'ProjectQuestionnaireCategoryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.questionnaire.category',
    url: '/category/:categoryId'
    templateUrl: 'diligence/project/questionnaire/category/template.html'
    controller: 'ProjectQuestionnaireCategoryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.questionnaire.category',
    url: '/category/:categoryId'
    templateUrl: 'diligence/project/questionnaire/category/template.html'
    controller: 'ProjectQuestionnaireCategoryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.questionnaire.category',
    url: '/category/:categoryId'
    templateUrl: 'diligence/project/questionnaire/category/template.html'
    controller: 'ProjectQuestionnaireCategoryController'
    controllerAs: 'vm'
