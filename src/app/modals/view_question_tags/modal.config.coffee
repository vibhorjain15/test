angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_question_tags',
    controller: 'ViewQuestionTagsController'
    controllerAs: 'vm'
    size:'lg'
    resolve:
      template: ->
