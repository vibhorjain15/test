 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.thresholds',
     url: '/thresholds'
     templateUrl: 'form_adv/thresholds/template.html'
     controller: 'FormADVThresholdsController'
     controllerAs: 'vm'
