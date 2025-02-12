angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.user_profile',
    url: '/user_profile/:username'
    templateUrl: 'user_profile/template.html'
    controller: 'UserProfileController'
    controllerAs: 'vm'
    title: 'User Profile'
