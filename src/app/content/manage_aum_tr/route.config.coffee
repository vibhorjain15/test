angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.content.manage_aum_tr',
    url: '/aum_tr'
    templateUrl: 'content/manage_aum_tr/template.html'
    controller: 'ExcelSyncManageAumTrController'
    controllerAs: 'vm'
    accessible_to: ['manager','investor']
