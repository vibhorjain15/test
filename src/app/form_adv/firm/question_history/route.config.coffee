 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.question_history',
     url: '/question_history?questionId&start_at&end_at'
     templateUrl: 'form_adv/firm/question_history/template.html'
     controller: 'FormADVQuestionHistoryController'
     controllerAs: 'vm'
