 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.regulatory_monitor.portfolio',
     url: '/portfolio'
     templateUrl: 'form_adv/regulatory_monitor/portfolio/template.html'
     controller: 'FormADVRegulatoryMonitorPortfolioController'
     controllerAs: 'vm'
