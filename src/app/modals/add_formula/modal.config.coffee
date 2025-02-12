angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_formula',
    controller: 'AddFormulaController'
    size: 'lg'
    resolve:
      question: ->