angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'map_standard_text',
    controller: 'MapStandardTextController'
    backdrop: 'static'
    resolve:
      editor: ->
      templateId: ->
      question: ->
