angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_aum_tr_table',
    controller: 'ManageAUMTRController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      table: ->
      entity_id: ->
      entity_type: ->
