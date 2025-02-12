angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_duplicate_firms',
    controller: 'ViewDuplicateFirmsController'
    controllerAs: 'vm'
    resolve:
      duplicateFirms: ->
      source: ->
