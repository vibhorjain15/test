angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'confirm_dialog',
    controller: 'ConfirmDialogController'
    keyboard: false
    size: 'sm'
    backdrop: 'static'
