angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'mfw_rating_feedback',
    controller: 'MFWRatingFeedbackController'
    # resolve:
      # disclaimer: ->

     