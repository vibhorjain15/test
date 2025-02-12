angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_response',
    controller: 'ViewResponseController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      response: ->
