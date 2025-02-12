angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'use_existing_document',
    controller: 'UseExistingDocumentController'
    backdrop: 'static'