angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'popup_message',
    controller: 'PopupMessageController'
    backdrop: 'static'
