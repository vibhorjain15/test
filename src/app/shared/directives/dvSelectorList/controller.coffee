class DVSelectorListController extends BaseController
    @register 'DVSelectorListController'

    @inject '$http', 'baseUrl', 'Restangular', '$attrs', '$scope', '$parse', '$log', 'Utils', 'ModalFactory'

    initialize: ->
        @$scope.$parent.$watch @$attrs.entities, (value) =>
            if value
                @entities = value
                @entitiesBackup = angular.copy value
                @loadNextPage()
                @loadFilterOptions()
                @loading_entities = false

        @loading_entities = true
        @selected_entities = @$scope.$parent.$eval(@$attrs.selection)
        @filter_params = @$scope.$parent.$eval(@$attrs.filterParams)
        @displayParams = @$scope.$parent.$eval(@$attrs.displayParams)
        @entity_type = @$scope.$parent.$eval (@$attrs.entityType)
        @badgeLabel = @$scope.$parent.$eval (@$attrs.badgeLabel)
        @selectedAll = false
        @filters_section = {show: false}
        @current_page = 1
        @totalItemsPerPage = 10
        @entitiesInPage = []

        unless @selected_entities?
            @selected_entities = []
            @$parse(@$attrs.selection).assign(@$scope.$parent, @selected_entities)

    selectEntity: (entity)=>
        entity.is_selected = true
        @selected_entities.push entity

        if @selected_entities.length == @entities.length
            @selectedAll = true
        else
            @selectedAll = false

    unSelectEntity: (entity)=>
        entity.is_selected = false
        index = _(@selected_entities).findIndex (item)=>
            item[@displayParams.id] == entity[@displayParams.id]
        @selected_entities.splice index,1

        if @selected_entities.length == @entities.length
            @selectedAll = true
        else
            @selectedAll = false

    selectAll: =>
        @selectedAll = true
        @selected_entities.length = 0
        _(@entities).each (entity)=>
            entity.is_selected = true
            @selected_entities.push entity

    viewQuestionTags: (template) =>
      @ModalFactory.invokeModal 'view_question_tags',
        resolve:
          template: => template

    unSelectAll: =>
        @selectedAll = false
        @selected_entities.length = 0
        _(@entities).each (entity)=>
            entity.is_selected = false

    toggleFiltersSection: =>
        @filters_section.show = !@filters_section.show

        if @filters_section.show
            @loadFilterOptions()

    loadFilterOptions: =>
        if @filter_params['strategyID'] and !@strategies
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
        @entities = angular.copy @entitiesBackup
        @filters = {}
        @loadNextPage()

    applyFilters: =>
        @entities = []
        _(@entitiesBackup).each (entity)=>
            status = true
            _(@filters).each (filterValue,filterKey)=>
                if (filterKey == 'name' and filterValue.length > 0 and entity[@displayParams[filterKey]].toLowerCase().indexOf(filterValue.toLowerCase()) == -1)
                    status = false
                else if filterKey == 'tag_id' and filterValue and entity.tags.indexOf(filterValue) == -1
                    status = false
                else if filterKey != 'name' and filterKey != 'tag_id' and filterValue and entity[@filter_params[filterKey]] != filterValue
                    status = false
            if status
              @entities.push angular.copy(entity)
        @selectedAll = false
        @selected_entities.length = 0
        @loadNextPage()

    loadNextPage: =>
        @entitiesInPage = []
        for i in [(@current_page - 1)*@totalItemsPerPage...@current_page*@totalItemsPerPage]
            @entitiesInPage.push @entities[i] if @entities[i]
