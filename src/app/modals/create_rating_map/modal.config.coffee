angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'create_rating_map',
    controller: 'CreateRatingMapController'
    resolve:
      template: ->