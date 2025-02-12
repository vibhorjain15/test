 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.state 'app.form_adv.firm.related_entities',
     url: '/related_entities'
     templateUrl: 'form_adv/firm/related_entities/template.html'
     controller: 'FormADVRelatedEntitiesController'
     controllerAs: 'vm'
