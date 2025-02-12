angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_contact',
    controller: 'ManageContactController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
      contact: ->
      entity_details: ->
      entity_type: ->
      source: ->
