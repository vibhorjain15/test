angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_summary',
    controller: 'ViewSummaryController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      entity: ->
      entity_type: ->
