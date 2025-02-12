angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_rating_scale',
    controller: 'AddRatingScaleController'
    resolve:
      editing_rating_scale: ->
      rating_scales: ->