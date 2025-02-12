angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.permission',
    abstract: true
    url: '/permission?entity_id&entity_type&entity_name'
    abstract: true
    template: '<ui-view />'
