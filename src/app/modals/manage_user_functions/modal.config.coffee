angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_user_functions',
    controller: 'AssignNewFunctionsBulkController'
    size: 'lg'
    resolve:
      usersList: ->
