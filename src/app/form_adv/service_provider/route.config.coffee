 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.service_provider',
     url: '/service_provider?unique_name&type'
     templateUrl: 'form_adv/service_provider/template.html'
     controller: 'FormADVServiceProviderController'
     controllerAs: 'vm'
