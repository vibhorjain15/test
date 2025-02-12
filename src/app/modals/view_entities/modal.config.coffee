angular.module('diligenceVault').config (ModalFactoryProvider) ->
    ModalFactoryProvider.registerModal 'view_entities',
        controller: 'ViewEntitiesController'
        controllerAs: 'vm'
        resolve:
            entities: ->
            entityType: ->
