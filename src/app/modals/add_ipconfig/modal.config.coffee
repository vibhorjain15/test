angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_ipconfig',
    controller: 'AddIPConfigController'
    size: 'lg'
