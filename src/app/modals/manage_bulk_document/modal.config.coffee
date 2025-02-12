angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_bulk_document',
    controller: 'DocumentBulkManageController'
    backdrop: 'static'
    resolve:
      documentOptions: ->