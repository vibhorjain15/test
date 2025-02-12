angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_threshold',
    controller: 'ManageThresholdController'
    size: 'lg'
