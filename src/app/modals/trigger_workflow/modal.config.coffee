angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'trigger_workflow',
    controller: 'TriggerWorkflowController'
    resolve:
      workflow: ->
      pageUrl: ->
