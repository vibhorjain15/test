angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_public_contacts',
    controller: 'ManagePublicContactController'
    backdrop: 'static'
    keyboard: false
    resolve:
      contact: ->
      entity_details: ->
      existing_contacts: ->
      entity_type: ->
