 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.adv_search',
     url: '/adv-search'
     templateUrl: 'form_adv/adv_search/template.html'
     controller: 'FormADVSearchController'
     controllerAs: 'vm'
