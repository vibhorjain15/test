 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.resources',
     url: '/resources'
     templateUrl: 'form_adv/resources/template.html'
     controller: 'FormADVResourcesController'
     controllerAs: 'vm'
