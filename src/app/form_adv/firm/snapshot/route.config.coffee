 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.snapshot',
     url: '/snapshot'
     templateUrl: 'form_adv/firm/snapshot/template.html'
     controller: 'FormADVSnapshotController'
     controllerAs: 'vm'
