angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_project_notes',
    controller: 'ManageProjectNotesController'
    backdrop: 'static'
    size: 'lg'
    resolve:
        response: ->
        diligenceId: ->
        firm_preferences: ->
        editable: ->