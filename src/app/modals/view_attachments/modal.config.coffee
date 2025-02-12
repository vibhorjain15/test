angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_attachments',
    controller: 'AttachmentsViewController'
    controllerAs: 'vm'
    backdrop: 'static'
    size: 'xl'
    resolve:
      email_id: ->
