angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.aum_tr',
    url: '/aum_tr'
    templateUrl: 'firms/profile/aum_tr/template.html'
    controller: 'FirmProfileAUMTRController'
    controllerAs: 'vm'
