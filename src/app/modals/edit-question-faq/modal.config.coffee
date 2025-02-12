angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit-question-faq',
    controller: 'EditQuestionFAQController'
    backdrop: 'static'
