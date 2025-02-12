angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'move_question',
    controller: 'MoveQuestionController'
    size: 'lg'
