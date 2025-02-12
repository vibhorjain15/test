angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'approve_duedate_extension',
    controller: 'DueDateApprovalController'
    resolve:
      diligence: ->
