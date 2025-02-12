angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'configure_grid_column',
    controller: 'ConfigureGridColumnController'
    size: 'lg'