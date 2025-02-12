angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_selected_entities',
    controller: 'ViewSelectedEntitiesController'
    controllerAs: 'vm'
    resolve:
        entities: ->
        filter: ->
        entityType: ->
        readonly: ->
        entityGroup: ->