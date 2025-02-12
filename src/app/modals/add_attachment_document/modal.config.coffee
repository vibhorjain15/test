angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_attachment_document',
    controller: 'AddAttachmentDocumentController'
    backdrop: 'static'
    resolve:
      question: ->