angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_vehicle',
    controller: 'ManageVehicleController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
      vehicle: ->
      edit_mode: ->
      source: ->
