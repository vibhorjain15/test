 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.potential_flags',
     url: '/potential_flags'
     templateUrl: 'form_adv/firm/potential_flags/template.html'
     controller: 'FormADVFlagsController'
     controllerAs: 'vm'
