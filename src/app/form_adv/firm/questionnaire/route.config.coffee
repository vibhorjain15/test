 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.questionnaire',
     url: '/questionnaire?filter'
     templateUrl: 'form_adv/firm/questionnaire/template.html'
     controller: 'FormADVQuestionnaireController'
     controllerAs: 'vm'
