 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.filings_history',
     url: '/filings_history?has_threshold&start_at&end_at&skip_default'
     templateUrl: 'form_adv/firm/filings_history/template.html'
     controller: 'FormADVFilingsHistoryController'
     controllerAs: 'vm'
