angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_approver_notes',
    controller: 'ViewApproverNotesController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      approver_notes: ->
