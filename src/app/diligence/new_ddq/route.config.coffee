angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.newddq',
    url: '/newddq?request&type&entity_type&entity_id'
    template: '<ng2-new-ddq></ng2-new-ddq>'
    hidden_from: ['investor']