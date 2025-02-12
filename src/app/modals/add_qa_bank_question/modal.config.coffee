angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_qa_bank_question',
    controller: 'AddQABankQuestionController'
    size: 'lg'
    resolve:
      source : ->
      entity_details : ->
      response : ->
      assigned_tags: ->