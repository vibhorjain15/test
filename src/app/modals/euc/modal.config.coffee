angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'euc',
    controller: 'EUCController'
    keyboard: false
    size: 'md'
    backdrop: 'static'
