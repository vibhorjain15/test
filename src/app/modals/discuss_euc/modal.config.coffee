angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'discuss_euc',
    controller: 'DiscussEUCController'
    keyboard: false
    size: 'xl'
    backdrop: 'static'
