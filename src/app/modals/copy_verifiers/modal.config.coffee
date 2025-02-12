angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'copy_verifiers',
    controller: 'CopyVerifiersController'
    keyboard: false
    size: 'md'
    backdrop: 'static'
    resolve:
      diligence: ->