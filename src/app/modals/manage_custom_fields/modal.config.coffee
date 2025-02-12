angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_custom_fields',
    controller: 'ManagerCustomFieldsController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
        entityId: ->
        entityType: ->
        customFields: ->
        entityTypeId: ->