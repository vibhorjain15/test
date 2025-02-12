angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'nested_questions',
    controller: 'NestedQuestionsController'
    keyboard: false
    size: 'xl'
    backdrop: 'static'
