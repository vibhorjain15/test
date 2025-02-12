angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'parser_question_validations',
    controller: 'ParserQuestionValidationController'
    backdrop: 'static'
    resolve:
      data: ->
