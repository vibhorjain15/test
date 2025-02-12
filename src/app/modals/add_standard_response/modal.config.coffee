angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_standard_response',
    controller: 'AddStandardResponseController'
    backdrop: 'static'
    size: 'lg'
    resolve:
      response: ->
      diligence: ->
      mapped_diligences: -> 
      mapped_questions: ->
