angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'update_document_tags',
    controller: 'DocumentUpdateTagsController'
    backdrop: 'static'
