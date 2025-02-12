angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_users_to_function',
    controller: 'AddUsersToFunctionController'
    size: 'lg'
    backdrop: 'static'
    keyboard: false
    resolve:
      functionsList: ->
      existingFunctions: ->
