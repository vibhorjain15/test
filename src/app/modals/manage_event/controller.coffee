class ManageEventController extends ModalController

  @register 'ManageEventController'

  @inject '$uibModalInstance', 'entity_type', 'entity_id', 'event', 'toaster', 'Restangular', 'keywordConstants','Utils', 'RestangularHeaderService', 'hierarchyConstants'

  initialize: ->
    @global_hierarchy_option = @hierarchyConstants.Strategy

    @eventDateFormat = 'YYYY-MM-DDTHH:mm:ss'
    # @RestangularHeaderService.RestangularWithHeader(@entity_id,@entity_type).all('rating_types').getList().then (response) =>
    @edit_mode = false
    @minDate = moment().subtract(1, 'year').toDate()
    @params = {}
    @durations = [
      {
        'name': '15 Mins'
        'id': 15
      }
      {
        'name': '30 Mins'
        'id': 30
      }
      {
        'name': '1 Hr'
        'id': 60
      }
      {
        'name': '1 Hr 15 Mins'
        'id': 75
      }
      {
        'name': '1 Hr 30 Mins'
        'id': 90
      }
      {
        'name': '1 Hr 45 Mins'
        'id': 105
      }
      {
        'name': '2 Hrs'
        'id': 120
      }
      {
        'name': '2 Hr 15 Mins'
        'id': 135
      }
      {
        'name': '2 Hr 30 Mins'
        'id': 150
      }
      {
        'name': '2 Hr 45 Mins'
        'id': 165
      }
      {
        'name': '3 Hrs'
        'id': 180
      }
      {
        'name': '3 Hr 15 Mins'
        'id': 195
      }
      {
        'name': '3 Hr 30 Mins'
        'id': 210
      }
      {
        'name': '3 Hr 45 Mins'
        'id': 225
      }
      {
        'name': '4 Hrs'
        'id': 240
      }
      {
        'name': '4 Hr 15 Mins'
        'id': 255
      }
      {
        'name': '4 Hr 30 Mins'
        'id': 270
      }
      {
        'name': '4 Hr 45 Mins'
        'id': 285
      }
      {
        'name': '5 Hrs'
        'id': 300
      }
      {
        'name': '5 Hr 15 Mins'
        'id': 315
      }
      {
        'name': '5 Hr 30 Mins'
        'id': 330
      }
      {
        'name': '5 Hr 45 Mins'
        'id': 345
      }
      {
        'name': '6 Hrs'
        'id': 360
      }
      {
        'name': '6 Hr 15 Mins'
        'id': 375
      }
      {
        'name': '6 Hr 30 Mins'
        'id': 390
      }
      {
        'name': '6 Hr 45 Mins'
        'id': 405
      }
      {
        'name': '7 Hrs'
        'id': 420
      }
      {
        'name': '7 Hr 15 Mins'
        'id': 435
      }
      {
        'name': '7 Hr 30 Mins'
        'id': 450
      }
      {
        'name': '7 Hr 45 Mins'
        'id': 465
      }
      {
        'name': '8 Hr'
        'id': 480
      }]

    @times = [
      {
        'name': '12:00 AM'
        'id': 0
      }
      {
        'name': '1:00 AM'
        'id': 1
      }
      {
        'name': '2:00 AM'
        'id': 2
      }
      {
        'name': '3:00 AM'
        'id': 3
      }
      {
        'name': '4:00 AM'
        'id': 4
      }
      {
        'name': '5:00 AM'
        'id': 5
      }
      {
        'name': '6:00 AM'
        'id': 6
      }
      {
        'name': '7:00 AM'
        'id': 7
      }
      {
        'name': '8:00 AM'
        'id': 8
      }
      {
        'name': '9:00 AM'
        'id': 9
      }
      {
        'name': '10:00 AM'
        'id': 10
      }
      {
        'name': '11:00 AM'
        'id': 11
      }
      {
        'name': '12:00 PM'
        'id': 12
      }
      {
        'name': '1:00 PM'
        'id': 13
      }
      {
        'name': '2:00 PM'
        'id': 14
      }
      {
        'name': '3:00 PM'
        'id': 15
      }
      {
        'name': '4:00 PM'
        'id': 16
      }
      {
        'name': '5:00 PM'
        'id': 17
      }
      {
        'name': '6:00 PM'
        'id': 18
      }
      {
        'name': '7:00 PM'
        'id': 19
      }
      {
        'name': '8:00 PM'
        'id': 20
      }
      {
        'name': '9:00 PM'
        'id': 21
      }
      {
        'name': '10:00 PM'
        'id': 22
      }

      {
        'name': '11:00 PM'
        'id': 23
      }]

    # if @entity_type == undefined
    #   @Restangular.all('firm_preferences/set_firm_entity_default').customGET().then (response) =>
    #     if response.set_firm_entity_default == @keywordConstants.Firm
    #       @setEntityType("Firm")
    #       #@getFirms()
    #     else
    #       @setEntityType("Fund")
    #       #@entity_type = 'Fund'
    #       #@getFunds()
    # else
    @setEntityType(@entity_type)


    if (@event)
      @params = angular.copy(@event)
      @params.event_start_at = @Utils.getLocalDateTime(@event.event_start_at).toDate()
      @params.start_time = @Utils.getLocalDateTime(@event.event_start_at).hour()
      @params.duration = moment.duration(moment(@event.event_end_at).diff(moment(@event.event_start_at))).as('minutes')
      @params.event_type = null
      @edit_mode = true
    else
      @params =
        entity_type: @entity_type
        entity_id: Number(@entity_id) if @entity_id

    @getEventTypes()

  setEntityType: (entity_type) ->
    @entity_type = entity_type
    @params.entity_type = entity_type
    if entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      @getFirms()
    else if entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
      @getAllStrategies()
    else
      @getFunds()
    return

  getFirms: () =>
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
    @Restangular.all('service/dvapi_service/firm_search').post(params).then (response) =>
      @entities = response.data

  getFunds: () =>
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
    @Restangular.all('service/dvapi_service/fund_search').post(params).then (response) =>
      @entities = response.data

  getAllStrategies: () ->
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
        search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @entities = angular.copy response.data

  getEventTypes: () =>
    @Restangular.all('event_types').getList().then (response) =>
      if(@event)
        @params.event_type = Number(@event.event_type_id)
      @types = response

  generatePageUrl: =>
    pageUrl = ""
    if @entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl = "app/firms/#{@params.entity_id}/events"
    else if @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      fundIndex = _(@entities).findIndex (fund)=>
        fund.id == @params.entity_id
      firmId = @entities[fundIndex].firm_id
      pageUrl = "app/firms/#{firmId}/funds/#{@params.entity_id}/events"
    pageUrl

  save: ->
    if @event_form.$valid
      @saving = true

      @eventParams = angular.copy @params
      # As of now setting event time to start of the day, later we may need to update this part
      startTime = moment(@eventParams.event_start_at).hour(@eventParams.start_time)
      @eventParams.event_end_at = moment(@eventParams.event_start_at).hour(@eventParams.start_time).add(@eventParams.duration,"minutes").utc().format(@eventDateFormat)
      @eventParams.event_start_at = startTime.utc().format(@eventDateFormat)

      pageUrl = if not @edit_mode then @generatePageUrl() else null

      if @edit_mode
        @RestangularHeaderService.RestangularWithHeader(pageUrl)
          .one('entity_events', @params.id).customPUT(@eventParams)
          .then (response) =>
            @toaster.pop 'success', '', 'Event successfully updated'
            @close(response)
          .finally => @saving = false

      else
        @RestangularHeaderService.RestangularWithHeader(pageUrl)
          .all('entity_events').post(@eventParams)
          .finally => @saving = false
          .then (response) =>
            @toaster.pop 'success', '', 'Event successfully added'
            @close(response)
