angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_rating_custom_fields',
    controller: 'ManageRatingCustomFieldController'
    backdrop: 'static'
    keyboard: false
    size: 'lg'
    resolve:
        entityId: ->
        entityType: ->
        entityTypeId: ->
        subEntityId: ->
        rating: ->
        ratingScales: ->
        readonly: ->
        enable_tracking: ->
        parentScope: ->
        naValue: ->
        functions: ->
        assignedFunctions: ->