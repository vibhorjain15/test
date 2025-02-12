angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.welcome_to_dv',
    url: '/welcome_to_dv?redirectToState&redirectToParams'
    templateUrl: 'welcome_to_dv/template.html'
    controller: 'WelcomeToDVController'
    controllerAs: 'vm'
    data:
      title: 'Welcome to DiligenceVault'
