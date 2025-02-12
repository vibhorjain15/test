angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'upload_document',
    controller: 'UploadDocumentController'
    backdrop: 'static'
