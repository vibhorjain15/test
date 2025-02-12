angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_disclaimer',
    controller: 'AddDisclaimerController'
    resolve:
      disclaimer: ->
     