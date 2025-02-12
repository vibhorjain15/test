angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'assign_sme_bulk',
    controller: 'AssignSMEBulkController'
    size: 'lg'
