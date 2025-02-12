angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'edit_inbound_opportunity',
    controller: 'EditInboundOpportunityController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      inbound: ->
