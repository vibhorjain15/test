angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_ddq',
    controller: 'AddDDQController'
    size: 'lg'
    resolve:
      entity_id: ->
      entity_type: ->
      entity_name: ->
      type: ->
      template_id:->
      request:->
      source:->