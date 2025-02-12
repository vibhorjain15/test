angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_rating_scheme',
    controller: 'AddRatingSchemeController'
    resolve:
      rating_scheme: ->