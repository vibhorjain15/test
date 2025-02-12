angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.review_definitions.list',
    url: '/list'
    template: ' <ng2-review-definitions-list></ng2-review-definitions-list> '
