angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.welcome',
    url: '/welcome?help&redirectToState&redirectToParams'
    templateUrl: 'welcome/template.html'
    controller: 'WelcomeController'
    controllerAs: 'vm'
    data:
      title: 'Welcome to DiligenceVault'
