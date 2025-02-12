class DvReportTemplatesSelectorController extends BaseController
    @register 'DvReportTemplatesSelectorController'

    @inject '$http', 'baseUrl', 'Restangular', '$attrs', '$scope', '$parse', '$log', 'Utils', 'ModalFactory'

    initialize: ->
        @templateUrl = ""
        @$scope.$watch 'entities', (value) =>
            if value
                @entities = value
                @entitiesBackup = value
                @loadNextPage()
                @loadFilterOptions()
                @loading_entities = false

        @loading_entities = true

        @entity_type = @$scope.entityType
        @templateName = @$scope.templateName
        @filter_params = @$scope.filterParams
        @displayParams = @$scope.displayParams
        @selected_entities = @$scope.selection
        @templateUrl = "shared/report-list-templates/#{@templateName}.html"

        @selectedAll = false
        @filters_section = {show: false}
        @current_page = 1
        @totalItemsPerPage = 10
        @entitiesInPage = []

    selectEntity: (entity)=>
        entity.is_selected = true
        @$scope.selection.push entity
        if @$scope.selection.length == @entities.length
            @selectedAll = true
        else
            @selectedAll = false

    unSelectEntity: (entity)=>
        entity.is_selected = false
        index = _(@$scope.selection).findIndex (item)=>
            item[@displayParams.id] == entity[@displayParams.id]
        @$scope.selection.splice index,1

        if @$scope.selection.length == @entities.length
            @selectedAll = true
        else
            @selectedAll = false

    selectAll: =>
        @selectedAll = true
        @$scope.selection.length = 0
        _(@entities).each (entity)=>
            entity.is_selected = true
            @$scope.selection.push entity

    unSelectAll: =>
        @selectedAll = false
        @$scope.selection.length = 0
        _(@entities).each (entity)=>
            entity.is_selected = false

    toggleFiltersSection: =>
        @filters_section.show = !@filters_section.show

        if @filters_section.show
            @loadFilterOptions()

    loadFilterOptions: =>
        if @filter_params['strategyId'] and !@strategies
            @Restangular.all('strategies/tagged').getList().then (response) =>
                @strategies = response
        if @filter_params['tag_id'] and !@tags
            @Restangular.all('tags').getList(in_use: true).then (response) =>
                @tags = response
        if @filter_params['relationship_status_id'] and !@statusTags
            @Restangular.all('tags').getList(type: 'Status').then (response) =>
                @statusTags = response
        if @filter_params['section_id']
            @sectionFilterSource = @$scope.$parent.$eval (@$attrs.sectionFilterSource)

    resetFilters: ->
        @entities = @entitiesBackup
        @filters = {}
        @loadNextPage()

    applyFilters: =>
        @entities = _(@entitiesBackup).filter (entity)=>
            status = true
            _(@filters).each (filterValue,filterKey)=>
                if (filterKey == 'name' and filterValue.length > 0 and entity[@displayParams[filterKey]].toLowerCase().indexOf(filterValue.toLowerCase()) == -1)
                    status = false
                else if filterKey != 'name' and filterValue and entity[@filter_params[filterKey]] != filterValue
                    status = false
            status
        @selectedAll = false
        @loadNextPage()

    loadNextPage: =>
        @entitiesInPage = []
        for i in [(@current_page - 1)*@totalItemsPerPage...@current_page*@totalItemsPerPage]
            @entitiesInPage.push @entities[i] if @entities[i]
