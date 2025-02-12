 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.private_funds',
     url: '/private_funds'
     templateUrl: 'form_adv/firm/private_funds/template.html'
     controller: 'FormADVFundsController'
     controllerAs: 'vm'
