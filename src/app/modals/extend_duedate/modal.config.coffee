angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'extend_duedate',
    controller: 'DueDateController'
    resolve:
      diligence: ->
