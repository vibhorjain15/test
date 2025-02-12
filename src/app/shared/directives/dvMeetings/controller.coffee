class DvMeetingsController extends BaseController
  @register 'DvMeetingsController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster', 'SweetAlert', '$timeout','Utils','$filter'

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityType, @$attrs.entityId], (values) =>
      if values[0] && values[1]
        @entity_type = values[0]
        @entity_id = values[1]
        if (@$attrs.dateFilter and @customDateFilter) or not @$attrs.dateFilter
          @getMeetings()
        deregisterer()

    @$scope.$parent.$watch @$attrs.dateFilter, (newValue) =>
      if newValue
        @customDateFilter = newValue
        @getMeetings() if @entity_id and @entity_type

  getMeetings: ->
    params = {
      entity_type: @entity_type
      entity_id: @entity_id
    }
    if @customDateFilter
      params.start_date = @customDateFilter.startDate
      params.end_date = @customDateFilter.endDate

    @Restangular.all('entity_events').getList(params).then (response) =>
      @meetings = response

  addMeeting: ->
    @ModalFactory.invokeModal 'manage_event',
      resolve:
        entity_type : => @entity_type
        entity_id : => @entity_id
      success: (event) =>
        @getMeetings()

  editMeeting: (meeting, idx) =>
    @ModalFactory.invokeModal 'manage_event',
      resolve:
        entity_type : => @entity_type
        entity_id : => @entity_id
        event: => meeting
      success: (response) =>
        @meetings[idx] = response

  getMeetingsDate: (meetingDate) =>
    @Utils.getLocalDateTime(meetingDate).toDate()
