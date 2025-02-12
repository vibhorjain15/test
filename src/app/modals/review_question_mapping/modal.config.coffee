angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'review_question_mapping',
    controller: 'ReviewQuestionMappingController'
    backdrop: 'static'
    size: 'lg'