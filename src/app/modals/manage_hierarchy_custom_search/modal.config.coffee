angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_hierarchy_custom_search',
    controller: 'ManageHierarchyCustomSearchController'
    size: 'xl'
    resolve:
      custom_filters_data: ->