class ProjectNotesController extends BaseController

  @register 'ProjectNotesController'

  @inject '$stateParams', 'Restangular', '$scope', '$state', 'angularEnabled'

  initialize: ->
    @diligenceId = @$stateParams.diligenceId
    @current_user = @Utils.getCurrentUser()
    @initNotes()

    @$scope.$on 'delete:notes', (event, note) =>
      @removeNote(note)

  initNotes: () =>
    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
      if @current_user and @current_user.firmInfo
        permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
        if permissions_enabled
          @diligence.hasReadOnlyAccess = false
        else
          @diligence.isLocked = @diligence.isLocked || @diligence.hasReadOnlyAccess

    @Restangular.all('notes').getList(entity_type: 'Duediligence', entity_id: @diligenceId).then (response) =>
      grouped_notes = _(response).groupBy((note) ->
        note.child_entity_name
      )

      @note_count = response.length
      @grouped_notes = _(grouped_notes).map((notes, child_entity_name) ->
        {
        child_entity_name: child_entity_name
        notes: notes
        }
      )

  removeNote: (deletedNote) =>
    _(@grouped_notes).each (group, i) =>
      _(group.notes).each (note, j) =>
        if note && note.id == deletedNote.id
          group.notes.splice j, 1

  redirectToSummary: ->
    # '^' means parent state, so here the parent state of this route is project. So goto -> project.summary
    @$state.go '^.summary'
