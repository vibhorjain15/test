angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_pre_approved',
    controller: 'AddPreApprovedController'
    size: 'lg'
    resolve:
      source : ->
      entity_details : ->
      response : ->
      assigned_tags: ->