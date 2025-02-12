angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'custom_export',
    controller: 'CustomExportController'
    resolve:
        diligence: ->