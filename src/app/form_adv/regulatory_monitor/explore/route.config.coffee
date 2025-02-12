 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.regulatory_monitor.explore',
     url: '/explore'
     templateUrl: 'form_adv/regulatory_monitor/explore/template.html'
     controller: 'FormADVExploreTrackController'
     controllerAs: 'vm'
