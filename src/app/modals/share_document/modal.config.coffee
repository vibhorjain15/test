angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'share_document',
    controller: 'ShareDocumentController'
    backdrop: 'static'
