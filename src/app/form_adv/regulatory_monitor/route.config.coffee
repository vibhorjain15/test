angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.form_adv.regulatory_monitor',
    url: '/regulatory_monitor'
    template: '<ng2-regulatory-tabs></ng2-regulatory-tabs>' 
