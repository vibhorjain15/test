angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_document',
    controller: 'DocumentAddController'
    backdrop: 'static'
