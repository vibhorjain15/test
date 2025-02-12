angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'reject_pending_request',
    controller: 'RejectPendingRequestController'
    keyboard: false
    size: 'md'
    backdrop: 'static'
