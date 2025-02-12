 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.private_fund',
     url: '/private_fund?firmCRD&sequence_id'
     templateUrl: 'form_adv/private_fund/template.html'
     controller: 'FormADVFundSnapshotController'
     controllerAs: 'vm'
