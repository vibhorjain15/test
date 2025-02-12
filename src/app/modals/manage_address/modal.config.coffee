angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_address',
    controller: 'ManageAddressController'
    resolve:
      address: ->
      entity_type: ->
      entity_id: ->
