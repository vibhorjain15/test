angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit_share_class',
    controller: 'EditShareClassController'
    controllerAs: 'vm'
    backdrop: 'static'
