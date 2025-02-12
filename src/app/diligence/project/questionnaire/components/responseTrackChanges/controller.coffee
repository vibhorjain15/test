class ResponseTrackChangesController extends BaseController
    @register 'ResponseTrackChangesController'

    @inject 'Restangular', '$timeout', 'Utils', 'responseStatus', 'trackChangeStatus'

    initialize: ->

    acceptChanges: =>
        @response.attributes.track_change_status = @trackChangeStatus.ACCEPTED
        if @response.responseType in ['CheckBox','Dropdown']
            @response.scope.vm.oldListValue = null
        @onResponseChanged()

    rejectChanges: =>
        temp = @response.responses_history
        @response.responses_history = @response.attributes
        @response.attributes = temp
        if @response.attributes
            @response.attributes.track_change_status = @trackChangeStatus.REJECTED
        else
            @response.attributes = 
                track_change_status : @trackChangeStatus.REJECTED
                response_status : @responseStatus.STARTED
        if @response.responseType in ['CheckBox','Dropdown']
            @response.scope.vm.oldListValue = null
        @response.deserializeAttributes()
        @onResponseChanged()

    editResponse: =>
        @onResponseEdit()