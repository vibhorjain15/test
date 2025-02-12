class MeetingDetailController extends BaseController

  @register 'MeetingDetailController'

  @inject '$stateParams', 'DocumentDataservice', 'ModalFactory','Restangular','Utils','$scope', 'SweetAlert', 'toaster', '$state', 'angularEnabled'

  initialize: ->
    @meetingId = @$stateParams.Id
    @event_time = null
    @entity_type = 'Meeting'
    @note_id = null
    @notesOptions=
      fullscreen:true
      undoRedo:true
      height:180

    @getMeetingDetail()

  getMeetingDetail: ->
    @Restangular.one('entity_events', @meetingId).get().then (response) =>
      @meeting = response
      @convertTimeToLocal()

  convertTimeToLocal :=>
    @localtime = @Utils.getLocalDateTime(@meeting.event_start_at).toDate()
    @event_start_time = @Utils.getLocalDateTime(@meeting.event_start_at).format("LT")
    @event_end_time = @Utils.getLocalDateTime(@meeting.event_end_at).format("LT")

  openUploadDocumentModal: ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: true
          entityType: @entity_type
          entityId: @meetingId
          mode: 'update'
      success: =>
        @$scope.$broadcast 'documents:load'

  editMeeting: ->
    @ModalFactory.invokeModal 'manage_event',
      resolve:
        event: @meeting
        entity_type:=> @meeting.entity_type
        entity_id:=> @meeting.entity_id
      success: (response) =>
        @meeting = response
        @convertTimeToLocal()

  deleteMeeting: ->
     @SweetAlert.confirm({
      title: 'Are you sure you want to delete this meeting ?'
      confirmButtonText: 'Yes, please.'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @Restangular.one('entity_events', @meetingId).remove().then (response) =>
          @toaster.pop 'success', '', "Meeting deleted successfully"
          @$state.go 'app.dash' , {dashType : 'Monitor'}
        .finally => swal.close()
    })
        