angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_rating_scale',
    controller: 'ManageRatingScaleController'
    controllerAs: 'vm'
    size: 'xl'
    backdrop: 'static'
