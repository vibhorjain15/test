angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.word_to_template',
    url: '/word_to_template/:doc_id?type'
    templateUrl: 'diligence/word_to_template/template.html'
    controller: 'DiligenceWordTemplatesController'
    controllerAs: 'vm'
    hidden_from: ['investor']
