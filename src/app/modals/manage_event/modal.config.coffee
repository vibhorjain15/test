angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_event',
    controller: 'ManageEventController'
    size: 'lg'
    resolve:
      event: ->
      entity_type: ->
      entity_id: ->
