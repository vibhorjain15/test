angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'confirm_pending_request',
    controller: 'ConfirmPendingRequestController'
    keyboard: false
    size: 'md'
    backdrop: 'static'
