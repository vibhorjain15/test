angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_custom_tags',
    controller: 'AddCustomFieldsController'
    resolve:
      type: ->
      existing_tags: ->
      editIndex: ->
      maxOrder: ->
      typeId: ->
      entityId: ->
      schema_format: ->
      source: ->