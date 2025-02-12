angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.content.questions',
    url: '/questions?type'
    templateUrl: 'content/qa-bank/template.html'
    controller: 'DiligenceQuestionAnswersBankController'
    controllerAs: 'vm'
    hidden_from: ['investor']
