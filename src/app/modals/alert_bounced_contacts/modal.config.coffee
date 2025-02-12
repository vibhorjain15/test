angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'alert_bounced_contacts',
    controller: 'AlertBouncedContactsController'
    backdrop: 'static'
    keyboard: false
    resolve:
      contactsList: ->
      firmsList: ->