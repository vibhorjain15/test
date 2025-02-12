class FilteredEntitySelectorController extends BaseController
    @register 'FilteredEntitySelectorController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','hierarchyConstants','FILTER_TYPES','FILTER_TERNARY_OPERATORS','ModalFactory'

    initialize: ->
        @entitySearchApiMap = {
            Firm:{
                api: 'service/dvapi_service/firm_search'
                params:{
                    include_contacts: true,
                    include_custom_fields: true,
                    include_dates: true
                    is_active: true,
                }
            }
            "#{@hierarchyConstants.Title}": {
                api: 'service/dvapi_service/product_search'
                params:{
                    include_contacts: false,
                    include_custom_fields: false,
                    include_dates: true,
                    is_active: true,
                    search_for : @hierarchyConstants.Strategy
                }
            }
            Product: {
                api: 'service/dvapi_service/fund_search'
                params:{
                    include_contacts: true,
                    include_custom_fields: true,
                    include_dates: true,
                    is_active: true
                }
            }
            Vehicle: {
                api: 'service/dvapi_service/vehicle_search'
                params:{
                    include_contacts: true,
                    include_custom_fields: true,
                    include_dates: true,
                    is_active: true
                }
            }
        }
        @$scope.$watch 'vm.selectedEntities',(value)=>
            if value
                @getEntityFilteredData()

    getEntityFilteredData: =>
        unless @showFilterBasedSelection
            return
        @loadingEntityFilteredData = true
        params = @entitySearchApiMap[@entityType].params
        params.filters = "#{@globalTernaryOperator}" : []

        if @globalTernaryOperator == @FILTER_TERNARY_OPERATORS.OR
            promises = []
            for filter,index in @selectedFilters
                promises.push @getEntityData(filter, params, index)

            @$q.all(promises).then (response)=>
                @filterSelectedEntities()
                @getUnfilteredAndDuplicateSelectedEntities(true, true)
                @validateForm()
                @loadingEntityFilteredData = false
            ,(error)=>
                @loadingEntityFilteredData = false
        else
            for filter,index in @selectedFilters
                if filter.criteria_obj.type == @FILTER_TYPES.DATE
                    filter_params =
                        filter_key: filter.criteria_obj.filter_key,
                        filter_name: filter.criteria_obj.filter_name,
                        type: filter.criteria_obj.type,
                        operations: filter.condition,
                        filter_value: @Utils.getLocalDateTime(filter.advance_filter_value)
                else
                    filter_params =
                        filter_key: filter.criteria_obj.filter_key,
                        filter_name: filter.criteria_obj.filter_name,
                        type: filter.criteria_obj.type,
                        operations: filter.condition,
                        filter_value: filter.advance_filter_value
                params.filters[@globalTernaryOperator].push filter_params
            searchApi = @entitySearchApiMap[@entityType].api
            @Restangular.all(searchApi).post(params).then (response) =>
                for filter,index in @selectedFilters
                    @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"] =
                        allData: response.data
                        data: []
                        filter: filter
                        hasDuplicate: false
                        selectedLength: 0
                @filterSelectedEntities()
                @getUnfilteredAndDuplicateSelectedEntities(false, true)
                @validateForm()
                @loadingEntityFilteredData = false
            ,(error)=>
                @loadingEntityFilteredData = false

    getEntityData: (filter, params, index)=>
        searchApi = @entitySearchApiMap[@entityType].api
        if filter.criteria_obj.type == @FILTER_TYPES.DATE
            filter_params =
                filter_key: filter.criteria_obj.filter_key,
                filter_name: filter.criteria_obj.filter_name,
                type: filter.criteria_obj.type,
                operations: filter.condition,
                filter_value: @Utils.getLocalDateTime(filter.advance_filter_value)
        else
            filter_params =
                filter_key: filter.criteria_obj.filter_key,
                filter_name: filter.criteria_obj.filter_name,
                type: filter.criteria_obj.type,
                operations: filter.condition,
                filter_value: filter.advance_filter_value
        paramsCopy = angular.copy params
        paramsCopy.filters[@globalTernaryOperator] = [filter_params]

        promise = @Restangular.all(searchApi).post(paramsCopy).then (response) =>
            if @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"]
                @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"].allData = response.data
                @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"].data = []
                @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"].filter = filter
                @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"].hasDuplicate = false
                @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"].selectedLength = 0
            else
                @entitySearchMap["#{filter.criteria_obj.filter_key}_#{index}"] =
                    allData: response.data
                    data: []
                    filter: filter
                    template_id: null
                    hasDuplicate: false
                    selectedLength: 0
        promise

    filterSelectedEntities: =>
        @entityGroup = {}
        _(@selectedEntities).each (selectedEntity)=>
            if !@entityGroup[selectedEntity.id]
                @entityGroup[selectedEntity.id] = []
            entityKeys = Object.keys(@entitySearchMap)
            _(entityKeys).each (entityKey)=>
                entityList = @entitySearchMap[entityKey].allData
                _(entityList).each (entity)=>
                    if selectedEntity.id == entity.id
                        selectedEntity.selected = true
                        @entitySearchMap[entityKey].data.push selectedEntity
                        index = _(@entityGroup[selectedEntity.id]).indexOf(entityKey)
                        @entityGroup[selectedEntity.id].push entityKey if index == -1
                @entitySearchMap[entityKey].selectedLength = @getSelectedLength(@entitySearchMap[entityKey].data)

    getUnfilteredAndDuplicateSelectedEntities: (checkDuplicate, checkUnfiltered)=>
        if checkUnfiltered
            templateId = if @unfilteredSelectedEntities and @unfilteredSelectedEntities.template_id then @unfilteredSelectedEntities.template_id else null
            @unfilteredSelectedEntities = {
                data: []
                filter: null
            }
            @unfilteredSelectedEntities.template_id = templateId

        @duplicateFilteredEntites = []
        _(@selectedEntities).each (entity)=>
            if @entityGroup[entity.id].length == 0 and checkUnfiltered
                entity.selected = true
                @unfilteredSelectedEntities.data.push entity
            else if @entityGroup[entity.id].length == 1 and checkDuplicate
                _(@entityGroup[entity.id]).each (filter)=>
                    @entitySearchMap[filter].hasDuplicate = false if !@entitySearchMap[filter].hasDuplicate
            else if @entityGroup[entity.id].length > 1 and checkDuplicate
                @duplicateFilteredEntites.push entity
                _(@entityGroup[entity.id]).each (filter)=>
                    @entitySearchMap[filter].hasDuplicate = true

    displayFilter: (criterion) =>
        displayedFilter = ''
        value = ''
        if criterion.criteria_obj.type.toLowerCase() == 'date'
            if criterion.condition == 'between'
                startDate = moment(criterion.advance_filter_value.startDate).format("YYYY-MM-DD")
                endDate = moment(criterion.advance_filter_value.endDate).format("YYYY-MM-DD")
                displayedDate = startDate + ' to '+ endDate
            else
                displayedDate = moment(criterion.advance_filter_value).format("YYYY-MM-DD")
            displayedFilter = "#{criterion.criteria_obj.filter_name} : " + displayedDate
        else
            if criterion.criteria_obj.hasOwnProperty('options')
                for option in criterion.criteria_obj.options
                    if(option.id == criterion.advance_filter_value)
                        value = option.value
            if value != ''
                displayedFilter = "#{criterion.criteria_obj.filter_name} : " + value
            else
                displayedFilter = "#{criterion.criteria_obj.filter_name} : " + criterion.advance_filter_value
        displayedFilter

    viewSelectedEntities: (criteria, filterName, readonly)=>
        @ModalFactory.invokeModal 'view_selected_entities',
            resolve:
                entities: => angular.copy criteria.data
                filter: => criteria.filter
                entityType: => @entityType
                readonly: => if @globalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND or readonly then true else false
                entityGroup: => @entityGroup
            success:(response)=>
                criteria.data = response
                criteria.selectedLength = @getSelectedLength(criteria.data)
                criteria.hasDuplicate = false
                _(criteria.data).each (entity)=>
                    index = _(@entityGroup[entity.id]).indexOf(filterName)
                    if entity.selected and index == -1
                        @entityGroup[entity.id].push filterName
                    else if !entity.selected and index > -1
                        @entityGroup[entity.id].splice(index, 1)
                @resetDuplicate()
                @getUnfilteredAndDuplicateSelectedEntities(true, false)
                @validateForm()
                @onChange()

    resetDuplicate: =>
        entityKeys = Object.keys(@entitySearchMap)
        _(entityKeys).each (entityKey)=>
            @entitySearchMap[entityKey].hasDuplicate = false

    getSelectedLength: (entityList)=>
        _(entityList).filter((entity)=>
            entity.selected
        ).length

    validateForm: =>
        @isFilterFormValid = true
        if !@showFilterBasedSelection
            return
        entityKeys = Object.keys(@entitySearchMap)
        _(entityKeys).each (entityKey)=>
            if @entitySearchMap[entityKey].hasDuplicate
                @entitySearchMap[entityKey].valid = false
                @isFilterFormValid = false
            if @globalTernaryOperator == @FILTER_TERNARY_OPERATORS.OR and @entitySearchMap[entityKey].selectedLength > 0 and (@entitySearchMap[entityKey].template_id == null or @entitySearchMap[entityKey].template_id.length == 0)
                @entitySearchMap[entityKey].valid = false
                @isFilterFormValid = false
            else if @globalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND and @entitySearchMap[entityKey].selectedLength > 0 and (@allFilterTemplateId == null or @allFilterTemplateId.length == 0)
                @entitySearchMap[entityKey].valid = false
                @isFilterFormValid = false

        if @unfilteredSelectedEntities.data.length > 0 and (@unfilteredSelectedEntities.template_id == null or @unfilteredSelectedEntities.template_id.length == 0)
            @unfilteredSelectedEntities.valid = false
            @isFilterFormValid = false
