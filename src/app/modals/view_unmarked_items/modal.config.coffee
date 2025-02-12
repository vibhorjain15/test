angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_unmarked_items',
    controller: 'ViewUnmarkedItemsController'
    size: 'lg'
    resolve:
      items: ->
