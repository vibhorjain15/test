angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_firm',
    controller: 'ManageFirmController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
      firm: ->
      source: ->
      firm_name: ->
