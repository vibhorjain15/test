angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_task',
    controller: 'ManageTaskController'
    resolve:
      task: ->
