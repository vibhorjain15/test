angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'assign_expiry_date_bulk',
    controller: 'AssignExpiryDateBulkController'
    size: 'lg'
