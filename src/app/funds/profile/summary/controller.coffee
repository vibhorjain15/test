class FundProfileSummaryController extends BaseController
  @register 'FundProfileSummaryController'

  @inject '$stateParams', 'Restangular', 'DueDiligenceDataservice',
          'FundDataservice', '$scope', 'toaster', 'SweetAlert',
          'Utils', 'ModalFactory', 'BaseDataService', '$q','angularEnabled'

  initialize: ->
    @fundId = @$stateParams.fundId
    @$scope.getFund().then (fund) =>
      @fund = fund

    @isEditable = @Utils.isManager()
    @entity_type = @Utils.getEntityType()
    @colorScheme = @Utils.getFirmColorScheme()
    @is_manager = @Utils.isManager()

    @getDDQs()
    @getAttachments()
    @getDefaultShareClassTables()

  toggleFundFollow: ->
    @toggling_fund_follow = true

    if @fund.status is 'Following'
      promise = @FundDataservice.unfollow(@fund.id)
    else
      promise = @FundDataservice.follow(@fund.id)

    promise.then (=>
      if @fund.status is 'Following'
        @fund.status = null
      else
        @fund.status = 'Following'
    )
    promise.finally (=>
      @toggling_fund_follow = false
    )

  editFund: (fund) =>
    @ModalFactory.invokeModal 'manage_fund',
      resolve:
        fund: => @fund
        source : => 'monitor'
      success: (fund) =>
        @fund = fund
      dismiss: (dismissObj) =>
        if dismissObj?
          @fund = dismissObj

  getDefaultShareClassTables: ->
    @$scope.getFund().then (fund) =>
      @FundDataservice.getShareClassTables(fund.parentFirm.id, fund.id).then (responses) =>
        @default_track_record = _(responses).findWhere(type: 'track_record')
        @default_aum = _(responses).findWhere(type: 'aum')

        @getDefaultShareClassReturnValues().then (response) =>
          config = @getConfig(response)

          config.axis.y =
            tick:
              format: (y) ->
                y = Number(y.toFixed(2))

                "#{y}%"

          @return_chart_config = config

        @getDefaultShareClassAUMValues().then (response) =>
          @aum_chart_config = @getConfig(response)
          @aum_chart_config.data.type = 'bar'

  getDefaultShareClassReturnValues: ->
    if @default_track_record
      @BaseDataService
        .getShareClassTableValues(@default_track_record.id).then (response) =>
          response = @processDatesAndValues(response)
          response = _(response).sortBy (fund_return) ->
            return +(new Date(fund_return.end_date))

          @processReturns(response)

          if response.length is 1
            @track_record_start_date = response[0].start_date
            @track_record_end_date = response[0].end_date
          else if response.length > 1
            @track_record_start_date = response[0].end_date
            @track_record_end_date = _(response).last().end_date

          response
    else
      defer = @$q.defer()
      defer.resolve([])
      defer.promise

  getDefaultShareClassAUMValues: ->
    if @default_aum
      @BaseDataService
        .getShareClassTableValues(@default_aum.id).then @processDatesAndValues
    else
      defer = @$q.defer()
      defer.resolve([])
      defer.promise

  processDatesAndValues: (response) ->
    _(response).each (item) ->
      item.value ||= 0
      item.end_date = moment(item.end_date).format('YYYY-MM-DD')

    response

  processReturns: (fund_returns) ->
    _(fund_returns).each (fund_return, idx) ->
      return if idx is 0

      previous_return_value = fund_returns[idx - 1].value/100
      value = fund_return.value/100

      fund_return.value = ((1 + previous_return_value) * (1 + value) - 1)*100

      fund_return.value = Number(fund_return.value.toFixed(2))

  getConfig: (data) ->
    {
      data:
        json: data
        x_format: '%M-%Y'
        names:
          value: ''
        xs:
          value: 'end_date'
        keys:
          value: ['value']
          x: 'end_date'
      color:
        pattern: ['#008C97']
      legend:
        show: false
      grid:
        y:
          lines: [
            {value: 0, text: '', class: 'dashed-line'}
          ]
      axis:
        x:
          type: 'timeseries'
          tick:
            rotate: 60
            format: (x) ->
              moment(x).format("MMM-YYYY")
      color: pattern: @colorScheme
    }

  getDDQs: ->
    #TODO: technically would like to request top 5 using recordsPerPage: 5 if api is paginated
    @DueDiligenceDataservice.getDiligences(
      is_internal: true,
      entity_id: @fundId
    ).then (response) =>
      @ddqs = response.slice(0, 5)

  getAttachments: ->
    @FundDataservice.getAttachments(@fundId).then (response) =>
      @attachments = response

  getTemplates: ->
    @Restangular.all('templates').getList().then (response) =>
      @templates = response

  getFrequencies: ->
    @Restangular.all('frequency').getList().then (response) =>
      @frequencies = response

  getDiligences: ->
    @Restangular.one('funds', @fundId).all('diligences').getList().then (response) =>
      @diligences = response
