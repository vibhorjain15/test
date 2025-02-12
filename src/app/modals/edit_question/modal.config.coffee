angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit_question',
    controller: 'EditQuestionController'
    size: 'lg'
