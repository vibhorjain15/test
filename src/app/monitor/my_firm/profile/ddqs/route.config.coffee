angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.my_firm.profile.ddqs',
    url: '/ddqs'
    templateUrl: 'monitor/my_firm/profile/ddqs/template.html'
    controller: 'MyFirmProfileDDQController'
    controllerAs: 'vm'
