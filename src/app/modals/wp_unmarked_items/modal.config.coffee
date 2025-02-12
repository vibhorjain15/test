angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'wp_unmarked_items',
    controller: 'WpUnmarkedItemsController'
    size: 'lg'
    resolve:
      items: ->
