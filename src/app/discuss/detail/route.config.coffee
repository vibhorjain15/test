angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.discuss.detail',
    url: '/questions/:discussionId/:slug?action'
    templateUrl: 'discuss/detail/template.html'
    controller: 'DiscussionDetailController'
    controllerAs: 'vm'
