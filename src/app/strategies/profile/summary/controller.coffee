class StrategyProfileSummaryController extends BaseController
  @register 'StrategyProfileSummaryController'

  @inject '$stateParams', 'Restangular', 'DueDiligenceDataservice',
          'StrategyDataservice', '$scope', 'toaster', 'SweetAlert',
          'Utils', 'ModalFactory', 'BaseDataService', '$q','angularEnabled'

  initialize: ->
    @strategyId = @$stateParams.strategyId
    @$scope.getStrategy().then (strategy) =>
      @strategy = strategy

    @isEditable = @Utils.isManager()
    @entity_type = 'Strategy'
    @colorScheme = @Utils.getFirmColorScheme()
    @is_manager = @Utils.isManager()

    @getDDQs()
    @getAttachments()
    @getDefaultShareClassTables()

  toggleStrategyFollow: ->
    @toggling_strategy_follow = true

    if @strategy.status is 'Following'
      promise = @StrategyDataservice.unfollow(@strategy.id)
    else
      promise = @StrategyDataservice.follow(@strategy.id)

    promise.then (=>
      if @strategy.status is 'Following'
        @strategy.status = null
      else
        @strategy.status = 'Following'
    )
    promise.finally (=>
      @toggling_strategy_follow = false
    )

  editStrategy: =>
    @ModalFactory.invokeModal 'manage_master_fund',
      resolve:
        strategy: => @strategy
        source : => 'monitor'
      success: (strategy) =>
        @strategy = strategy
      dismiss: (dismissObj) =>
        if dismissObj?
          @strategy = dismissObj

  getDefaultShareClassTables: ->
    @$scope.getStrategy().then (strategy) =>
      @StrategyDataservice.getShareClassTables(strategy.parentFirm.id, strategy.id).then (responses) =>
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
          response = _(response).sortBy (strategy_return) ->
            return +(new Date(strategy_return.end_date))

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

  processReturns: (strategy_returns) ->
    _(strategy_returns).each (strategy_return, idx) ->
      return if idx is 0

      previous_return_value = strategy_returns[idx - 1].value/100
      value = strategy_return.value/100

      strategy_return.value = ((1 + previous_return_value) * (1 + value) - 1)*100

      strategy_return.value = Number(strategy_return.value.toFixed(2))

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
      entity_id: @strategyId,
      entity_type:@entity_type
    ).then (response) =>
      @ddqs = response.slice(0, 5)

  getAttachments: ->
    @StrategyDataservice.getAttachments(@strategyId).then (response) =>
      @attachments = response

  getTemplates: ->
    @Restangular.all('templates').getList().then (response) =>
      @templates = response

  getFrequencies: ->
    @Restangular.all('frequency').getList().then (response) =>
      @frequencies = response

  getDiligences: ->
    @Restangular.one('strategies', @strategyId).all('diligences').getList().then (response) =>
      @diligences = response
