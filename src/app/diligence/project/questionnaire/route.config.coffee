angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.questionnaire',
    url: '/questionnaire?status&q&panel'
    templateUrl: 'diligence/project/questionnaire/template.html'
    controller: 'ProjectQuestionnaireController'
    controllerAs: 'vm'
    onExit: (QuestionnaireCacheFactory) ->
      QuestionnaireCacheFactory.clear()

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.questionnaire',
    url: '/questionnaire?status&q&panel'
    templateUrl: 'diligence/project/questionnaire/template.html'
    controller: 'ProjectQuestionnaireController'
    controllerAs: 'vm'
    onExit: (QuestionnaireCacheFactory) ->
      QuestionnaireCacheFactory.clear()

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.questionnaire',
    url: '/questionnaire?status&q&panel'
    templateUrl: 'diligence/project/questionnaire/template.html'
    controller: 'ProjectQuestionnaireController'
    controllerAs: 'vm'
    onExit: (QuestionnaireCacheFactory) ->
      QuestionnaireCacheFactory.clear()

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.questionnaire',
    url: '/questionnaire?status&q&panel'
    templateUrl: 'diligence/project/questionnaire/template.html'
    controller: 'ProjectQuestionnaireController'
    controllerAs: 'vm'
    onExit: (QuestionnaireCacheFactory) ->
      QuestionnaireCacheFactory.clear()


angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.questionnaire',
    url: '/questionnaire?status&q&panel'
    templateUrl: 'diligence/project/questionnaire/template.html'
    controller: 'ProjectQuestionnaireController'
    controllerAs: 'vm'
    onExit: (QuestionnaireCacheFactory) ->
      QuestionnaireCacheFactory.clear()

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.questionnaire',
    url: '/questionnaire?status&q&panel'
    templateUrl: 'diligence/project/questionnaire/template.html'
    controller: 'ProjectQuestionnaireController'
    controllerAs: 'vm'
    onExit: (QuestionnaireCacheFactory) ->
      QuestionnaireCacheFactory.clear()
