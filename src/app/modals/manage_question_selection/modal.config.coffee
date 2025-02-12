angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_question_selection',
    controller: 'ManageQuestionSelectionController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
      selectedQuestions: ->
