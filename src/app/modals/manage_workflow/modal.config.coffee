angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_workflow',
    controller: 'ManageWorkflowController'
    size: 'lg'