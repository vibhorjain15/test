angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'new_user',
    controller: 'AddNewUserController'
    backdrop: 'static'
    resolve:
      fund: ->
      existing_user: ->
      source: ->
