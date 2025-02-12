angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.inbound.review_request',
    url: '/review_request?redirectId&investorId'
    templateUrl: 'inbound/review_request/template.html'
    controller: 'InboundReviewRequestController'
    controllerAs: 'vm'