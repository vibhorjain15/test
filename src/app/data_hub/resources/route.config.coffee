 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.data_hub.resources',
     url: '/resources'
     templateUrl: 'data_hub/resources/template.html'
     controller: 'FormADVResourcesController'
     controllerAs: 'vm'
