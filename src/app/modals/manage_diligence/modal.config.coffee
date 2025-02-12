angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_diligence',
    controller: 'ManageDiligenceController'
    resolve:
      diligence: ->
