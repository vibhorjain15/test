angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_subscribers',
    controller: 'ManageSubscribersDialogController'
    keyboard: false
    resolve:
      diligence: ->
