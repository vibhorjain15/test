angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_workflow_step',
    controller: 'ManageWorkflowStepController'
    size: 'lg'