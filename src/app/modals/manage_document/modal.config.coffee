angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_document',
    controller: 'DocumentManageController'
    backdrop: 'static'
    size: 'lg'
    resolve:
      documentOptions: ->