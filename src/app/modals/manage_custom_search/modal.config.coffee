angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_custom_search',
    controller: 'ManageCustomSearchController'
    size: 'xl'
    resolve:
      custom_filters_data: ->