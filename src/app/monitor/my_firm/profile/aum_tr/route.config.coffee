angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.my_firm.profile.aum_tr',
    url: '/aum_tr'
    templateUrl: 'monitor/my_firm/profile/aum_tr/template.html'
    controller: 'MyFirmProfileAUMTRController'
    controllerAs: 'vm'
