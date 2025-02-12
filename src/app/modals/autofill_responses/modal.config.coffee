angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'autofill_responses',
    controller: 'AutoFillResponsesController'
    keyboard: false
    size: 'lg'
    backdrop: 'static'
