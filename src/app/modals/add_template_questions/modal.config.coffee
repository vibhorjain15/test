angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_template_questions',
    controller: 'AddTemplateQuestionsController'
    size: 'xl'
    backdrop: 'static'
