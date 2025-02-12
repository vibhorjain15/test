angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.question.detail',
    url: '/detail'
    templateUrl: 'diligence/question/detail/template.html'
    controller: 'QuestionDetailController'
    controllerAs: 'vm'
