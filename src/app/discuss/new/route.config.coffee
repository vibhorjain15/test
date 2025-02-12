angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.discuss.new',
    url: '/new'
    templateUrl: 'discuss/new/template.html'
    controller: 'NewDiscussionController'
    controllerAs: 'vm'
