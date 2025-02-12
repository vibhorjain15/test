angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.review_definitions.details',
    url: '/:reviewId'
    template: '<ng2-review-definitions-details></ng2-review-definitions-details>'
