angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_permissions',
    controller: 'ManagePermissionController'
    backdrop: 'static'
    size: 'lg'