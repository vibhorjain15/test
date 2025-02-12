angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_disclaimer',
    controller: 'ViewDisclaimerController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      id: ->
