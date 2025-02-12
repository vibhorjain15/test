angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.partnership',
    url: '/partnership?entity_id&entity_type&entity_name'
    templateUrl: 'partnership/template.html'
    controller: 'PartnershipController'
    hidden_from: ['securityAdmin']
    # template: '<ui-view />'
