angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'upload_crd',
    controller: 'CRDUploadController'
    backdrop: 'static'
