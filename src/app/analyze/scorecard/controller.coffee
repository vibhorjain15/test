class ScorecardController extends BaseController

    @register 'ScorecardController'

    @inject 'Restangular', 'Utils', '$q','keywordConstants','FILTER_TERNARY_OPERATORS','ModalFactory','$http', 'toaster','headerConstants','ratingConstants','$filter', 'hierarchyConstants', 'angularEnabled', '$window'

    initialize: ->
        @minDate = moment().subtract(5,'years').toDate()
        @isManager = @Utils.isManager()
        @global_hierarchy_option = @hierarchyConstants.Strategy
        @maxDate = new Date()
        @filters = {
            as_of_date: new Date()
            include_portfolio: false
            include_portfolio_as_of_date: false
        }
        @portfolioDateLabel = "Include all data"
        @filterApplied = false
        @entityTypes = [
            {
                name: @keywordConstants.Firm
                label: @Utils.getDisplayEntityType(@keywordConstants.Firm)
                icon: 'institution'
                size: '1x'
                getUrl: 'service/dvapi_service/firm_search'
            }
            {
                name: @keywordConstants.Strategy
                label: @Utils.getDisplayEntityType(@keywordConstants.Strategy)
                icon: 'strategy'
                size: '1x'
                getUrl: 'service/dvapi_service/product_search'
            }
            {
                name: @keywordConstants.Product
                label: @Utils.getDisplayEntityType(@keywordConstants.Product)
                icon: 'fund'
                size: '1x'
                getUrl: 'service/dvapi_service/fund_search'
            }
            {
                name: @keywordConstants.Vehicle
                label: @Utils.getDisplayEntityType(@keywordConstants.Vehicle)
                icon: 'vehicle-car'
                size: '1x'
                getUrl: 'service/dvapi_service/vehicle_search'
            }
        ]
        @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
        @global_ternary_operator_for_peer = @FILTER_TERNARY_OPERATORS.AND
        @global_hierarchy_option = @hierarchyConstants.Strategy

        @heatmap_options = {
            heatmap_orientation : "X"
            invertColor: false
            hide_dates: false
        }

        @entityList = []
        @peerEntityList = []
        @getFirmPref()

        @getRatingSchemes()
        if @isManager
          @$window.history.back()
          return

    getFirmPref: =>
        @loading_prefs = true
        @Restangular.all('firm_preferences').customGET().then (response) =>
            @predefinedDate = @Utils.getPredefinedDateRanges(response.default_daterange_months)
            @predefinedDate.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
            if not @customDateFilter
                @customDateFilter = @predefinedDate
            if response.enable_yaxis_entity
                @heatmap_options.heatmap_orientation = "Y"

            if response.invert_color
                @heatmap_options.invertColor = response.invert_color
            if response.set_firm_entity_default
                _(@entityTypes).each (entity)=>
                    if entity.name == response.set_firm_entity_default
                        @setEntityType(entity)
            else
                @setEntityType(@entityTypes[0])
            @setPorfolioDateLabel()
            @loading_prefs = false

    getSearchFilters: =>
        @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@entity_type.name.toLowerCase()).then (response) =>
            @search_filters_response = response
            @search_criterias = []
            @search_criterias_for_peer_search = []
            @filters_data_loaded = true
            @filters_peer_data_loaded = true
            for filter,index in  @search_filters_response.default_filters
                if filter.hasOwnProperty('endpoint')
                    @getDynamicDefaultFilterOptions(filter,index)
            for filter,index in  @search_filters_response.custom_filters
                if filter.hasOwnProperty('endpoint')
                    @getDynamicCustomFilterOptions(filter,index)

            @search_filters_for_peer_search =
                response_type: @search_filters_response.response_type
                default_filters: _(@search_filters_response.default_filters).filter (filter)=>
                    filter.filter_key != 'name'
                custom_filters: _(@search_filters_response.custom_filters).filter (filter)=>
                    filter.filter_key != 'name'

    setPorfolioDateLabel: =>
        if @customDateFilter.selectedRange == 'No Filter'
            @portfolioDateLabel = "Include all data"
        else
            @portfolioDateLabel = "Include from "+@$filter('date')(@customDateFilter.startDate.toDate())+" to "+ @$filter('date')(@customDateFilter.endDate.toDate())

    getRatingSchemes: =>
        @Restangular.all('rating_types').getList().then (response) =>
            @rating_types = response

    setEntityType: (type)=>
        @entity_type = type
        promises = []
        @loading_entities = true
        promises.push @getEntities({
            include_contacts: true,
            include_custom_fields: true,
            include_dates: true,
            is_active: true,
            filters: "#{@global_ternary_operator}" : []
        })
        promises.push @getSearchFilters()
        @$q.all(promises).then (response)=>
            @peerEntityList = []
            @loading_entities = false
        ,(error)=>
            @loading_entities = false

    applyMethod: =>
        @setPorfolioDateLabel()

    filterEntities: =>
        @ModalFactory.invokeModal 'manage_custom_search',
            resolve:
                custom_filters_data: =>
                    global_ternary_operator: @global_ternary_operator
                    search_filters_response : @search_filters_response
                    search_criterias:@search_criterias
            success: (response) =>
                @search_criterias = response.search_criterias
                @global_ternary_operator =  response.global_ternary_operator
                promises = []
                @loading_entities = true
                if !_.isEmpty response.searchByFiltersParams
                    @filterApplied = true
                    response.searchByFiltersParams["search_for"] = @global_hierarchy_option
                    response.searchByFiltersParams["is_active"] = true
                    promises.push @getEntities(response.searchByFiltersParams)
                else
                    @filterApplied = false
                    promises.push @getEntities({
                        include_contacts: true,
                        include_custom_fields: true,
                        include_dates: true,
                        is_active: true,
                        search_for: @global_hierarchy_option,
                        filters: "#{@global_ternary_operator}" : []
                    })
                @$q.all(promises).then (response)=>
                    @loading_entities = false
                ,(error)=>
                    @loading_entities = false

    filterPeerEntities: =>
        @ModalFactory.invokeModal 'manage_custom_search',
            resolve:
                custom_filters_data: =>
                    global_ternary_operator: @global_ternary_operator_for_peer
                    search_filters_response : @search_filters_for_peer_search
                    search_criterias:@search_criterias_for_peer_search
            success: (response) =>
                @search_criterias_for_peer_search = response.search_criterias
                @global_ternary_operator_for_peer =  response.global_ternary_operator
                promises = []
                @loading_peer_entities = true
                if !_.isEmpty response.searchByFiltersParams
                    @filterAppliedPeer = true
                    response.searchByFiltersParams["search_for"] = @global_hierarchy_option
                    promises.push @getPeerEntities(response.searchByFiltersParams)
                else
                    @filterAppliedPeer = false
                    promises.push @getPeerEntities({
                        include_contacts: true,
                        include_custom_fields: true,
                        is_active: true,
                        include_dates: true,
                        search_for: @global_hierarchy_option
                        filters: "#{@global_ternary_operator}" : [],
                    })
                @$q.all(promises).then (response)=>
                    @loading_peer_entities = false
                ,(error)=>
                    @loading_peer_entities = false

    getEntities: (filters)=>
        if @entity_type.name == @keywordConstants.Strategy
            filters.search_for = @global_hierarchy_option
        @Restangular.all(@entity_type.getUrl).post(filters).then (response)=>
            @entityList = response.data

    getPeerEntities: (filters)=>
        @Restangular.all(@entity_type.getUrl).post(filters).then (response)=>
            @peerEntityList = response.data

    getRatingScales:=>
        @Restangular.one('v2/rating_scales',@filters.rating_scheme.rating_scale_id).one('versions',@filters.rating_scheme.rating_scale_version).getList('rating_scale_definitions')

    getRatingsData: =>
        if !@entityList || @entityList.length == 0
            @toaster.pop 'error','','Please select '+@entity_type.label+'(s)'
            return
        if @filters.include_peer_average and (!@peerEntityList or @peerEntityList.length == 0)
            @toaster.pop 'error','','Please select peer '+@entity_type.label+'(s)'
            return

        @scorecard_display_form.$setSubmitted true
        if @scorecard_display_form.$valid
            @loading_heatmap = true
            @heatmapResponse = null
            promise = []
            @rating_scales = null
            @naValue = null
            promise.push @getRatingScales().then (response)=>
                @rating_scales = response
                noValueIndex = _(@rating_scales).findIndex (scale)=>
                    parseInt(scale.value) == @ratingConstants.naValue

                if noValueIndex > -1
                    @naValue = @rating_scales[noValueIndex]
                    @rating_scales.splice(noValueIndex,1)
                else
                    @naValue = []
            promise.push @getHeatmapResponse()
            @$q.all(promise).then =>
                @loading_heatmap = false


    getHeatmapResponse: =>
        params =
            fetch_latest: @filters.fetch_latest
            entity_ids:
                "#{@entity_type.name.toLowerCase()}": _(@entityList).pluck('id')
            include_portfolio: @filters.include_portfolio and !@filters.include_portfolio_as_of_date
            include_peer: @filters.include_peer_average
            peer_entity_ids: "#{@entity_type.name.toLowerCase()}": _(@peerEntityList).pluck('id') if @filters.include_peer_average
            include_portfolio_with_as_of_date: @filters.include_portfolio_as_of_date
            as_of_date : @Utils.formatDatetime(@filters.as_of_date) if @filters.include_portfolio_as_of_date
            include_average: @filters.include_average

        if @customDateFilter.selectedRange == 'No Filter'
            params.start_date = null
            params.end_date   = null
        else
            params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
            params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)
        @heatmap_options.hide_dates = @filters.hide_dates
        @Restangular.one('rating_schemes',@filters.rating_scheme.id).all('rating_scores_analysis').post(params).then (response)=>
            @heatmapResponse = response
            @diligencesToRefresh = []
            _(@heatmapResponse.data).each (diligences)=>
                if diligences.recalculation_needed
                    @diligencesToRefresh.push diligences.duediligence_id

    getDynamicCustomFilterOptions:(filter,index) =>
        if filter.method.toLowerCase() == 'get'
            requestPromise = @$http.get(filter.endpoint, filter.request_params)
        else if filter.method.toLowerCase() == 'post'
            requestPromise = @$http.post(filter.endpoint, filter.request_params)
        requestPromise.then (response) =>
            if filter.method.toLowerCase() == 'get'
                @search_filters_response.custom_filters[index].options = response.data
            else if filter.method.toLowerCase() == 'post'
                @search_filters_response.custom_filters[index].options = response.data.data
            for option in @search_filters_response.custom_filters[index].options
                @renameUsenameToValue(option,@search_filters_response.custom_filters[index].display_attribute)

    getDynamicDefaultFilterOptions:(filter,index) =>
        @$http.get(filter.endpoint).then (response) =>
            @search_filters_response.default_filters[index].options = response.data
            for option in @search_filters_response.default_filters[index].options
                @renameUsenameToValue(option,@search_filters_response.default_filters[index].display_attribute)

    renameUsenameToValue: (obj,key) =>
        obj['value'] = obj[key];
        delete obj[key];

    resetFiltersData: () =>
        @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
        @search_criterias = []
        @filterApplied = false

    openViewEntityModal: (entityList)=>
        @ModalFactory.invokeModal 'view_entities',
            resolve:
                entities: => entityList
                entityType: => @entity_type.label

    recalculate: =>
        @recalculating = true
        params = 
            duediligence_ids: @diligencesToRefresh
            from_heatmap: true
        @Restangular.all('diligences/recalculate_score').post(params).then (response)=>
            @toaster.pop 'success','Recalculation in progress','You will receive an email once it is done.'
            @diligencesToRefresh.length = 0
            @recalculating = false
        ,(error)=>
            @recalculating = false