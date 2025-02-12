angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'update_image',
    controller: 'ImageUpdateController'
    backdrop: 'static'
    size: 'xl'
