angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_verifier',
    controller: 'AddVerifierController'
    resolve:
      response: ->
      verificationType: ->
      verificationLevel: ->
      functions: ->