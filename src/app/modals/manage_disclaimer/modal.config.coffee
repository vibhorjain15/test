angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_disclaimer',
    controller: 'ManageDisclaimerController'
    resolve:
      disclaimer: ->

