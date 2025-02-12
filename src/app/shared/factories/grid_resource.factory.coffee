angular.module('diligenceVault').factory 'GridResourceService', (GridColumnService, Restangular, $q, $rootScope, Utils) ->

  class GridResource

    formatAttributes = (collection) ->
      _(collection).each (model) ->
        if model.dueDate
          # I know this is ugly! will make it generic soon
          model.dueDate = new Date(model.dueDate)

    constructor: (params) ->
      @col_defaults = {}
      @use_post_method = false
      @gridOptions = {}
      @columnDefs = []
      @params = params or {}
      @data = @params.data or []
      @transformerFns = []
      @enableGridExport()
      @savedData = {}
      @dateFilterList = []
      @selectedDateFilter = {}

    addTransformer: (fn) ->
      @transformerFns.push(fn)

    name: (name, options, transformerFn) ->
      @$resource = Restangular.all(name)

      if options
        Restangular.extendModel name, (model) ->
          _.extend model, options
          model

      Restangular.extendCollection name, (collection) ->
        formatAttributes collection

        if transformerFn?
          transformerFn(collection)

        collection

    disablePagination: ->
      @gridOptions.enablePaginationControls = false

    setGridName: (name) ->
      @gridOptions.gridName = name

    enableColumnMenus: ->
      @gridOptions.enableColumnMenus = true

    enableSaveFilter: ->
      @gridOptions.saveFilter = true

    enableFiltering: ->
      @enable_filtering = true

    enableAlphabetFiltering: =>
      @enable_alphabet_filtering = true

    isExportEnabled: ->
      if @gridOptions.enableExport? then @gridOptions.enableExport else false

    enableGridExport: =>
      @gridOptions.enableExport = true

    disableGridExport: ->
      @gridOptions.enableExport = false

    enableGridGrouping: (options={}) ->
      @gridOptions.enableGrouping = true

      if options.groupingShowCounts?
        @gridOptions.groupingShowCounts = options.groupingShowCounts

      if options.enableGroupHeaderSelection?
        @gridOptions.enableGroupHeaderSelection = options.enableGroupHeaderSelection

    enableRowSelection: (options={}) ->
      @gridOptions.enableRowSelection =  true

      if options.multi_select?
        @gridOptions.multiSelect = options.multi_select

      if options.full_row_selection?
        @gridOptions.enableFullRowSelection = options.full_row_selection

    disableRowSelection: ->
      @gridOptions.enableRowSelection = false

    setGridShowHideColumns: (value) ->
      @enableGridShowHideColumns = value

    isGridShowHideColumnEnabled: () ->
      @enableGridShowHideColumns

    enableRowHeaderSelection: (value) ->
      @gridOptions.enableRowHeaderSelection = value

    isRowSelectionEnabled: ->
      @gridOptions.enableRowSelection

    isFilteringEnabled: ->
      if @enable_filtering? then @enable_filtering else false

    isAlphabetFilteringEnabled: =>
      if @enable_alphabet_filtering? then @enable_alphabet_filtering else false

    setServerFilterable: (value) ->
      @server_side_filterable = value

    setServerPaginated: (value) ->
      @server_side_paginated = value
      @pagination_meta = {pageNumber: 1}

    disableExternalSorting: (value) ->
      @serverSideSorted = value

    isServerPaginated: ->
      @server_side_paginated

    isServerFilterable: ->
      @server_side_filterable

    isExternalSortDisabled: ->
      @serverSideSorted

    setColumnMenus: (value) ->
      @enableColumnMenus = value

    isColumnMenusEnabled: ->
      @enableColumnMenus

    colDefaults: (defaults) ->
      _.extend @col_defaults, defaults

    column: (field) ->
      column = GridColumnService.$new(field: field)

      _(@col_defaults).each (args, method) ->
        args = [args] unless _.isArray(args)

        column[method].apply column, args

      @columnDefs.push column

      column

    clearData: ->
      @data.splice 0, @data.length

    addEntity: (entity) ->
      @data.push entity

    removeEntity: (item) ->
      @data.splice @data.indexOf(item), 1

    populateData: (entities) ->
      @clearData()

      if @modifyFunction
        entities = @modifyData(entities)

      @transformData(entities)

      _(entities).each (entity) => @addEntity entity

    transformData: (entities) ->
      angular.forEach(@transformerFns, (fn) -> fn(entities))

    modifyDataFunction: (fn) =>
      @modifyFunction = fn

    modifyData: (entities) ->
      @modifyFunction(entities)

    loadPreviousPage: ->
      current_page = @pagination_meta.pageNumber
      previous_page = Math.max(current_page - 1, 1)

      @loadPage(previous_page)

    loadNextPage: ->
      current_page = @pagination_meta.pageNumber
      next_page = current_page + 1

      if @pagination_meta.totalPages?
        next_page = Math.min(next_page, @pagination_meta.totalPages)

      @loadPage(next_page)

    loadPage: (page_number, options) ->

      page_number ||= @pagination_meta.pageNumber

      if options?
        options.pageNumber = page_number
        options.recordsPerPage = Utils.getRecordsPerPageNum()
      else
        options = {pageNumber: page_number, recordsPerPage: Utils.getRecordsPerPageNum()}

      params = @getParams(options)

      params.pageNumber = page_number
      @$resource.customGET('', params).then (response) =>
        @populateData(response.results)
        _(@pagination_meta).extend(response.meta)
        $rootScope.$emit 'grid:loaded', { data: response }

        response

    loadPageWithNoResultsParam: (page_number, options) ->
      page_number ||= @pagination_meta.pageNumber

      if options?
        options.pageNumber = page_number
      else
        options = {pageNumber: page_number}

      params = @getParams(options)

      params.pageNumber = page_number
      @$resource.customGET('', params).then (response) =>
        @populateData(response.results)
        _(@pagination_meta).extend(response.meta)

        response

    loadAllData: (options) ->

      if !options?
        options = {}
        options.pageNumber = 1

      params = @getParams(options)

      @$resource.customGET('', params).then (response) =>
        params.pageNumber = 1
        params.recordsPerPage = response.meta.totalRecords
        @$resource.customGET('', params).then (fullData) =>

          fullData.results

    loadPageWithNoPagination: (options) ->

      params = @getParams(options)
      @$resource.customGET('', params).then (response) =>
        @populateData(response.results)
        _(@pagination_meta).extend(response.meta)

        response

    getParams: (options) ->
      _.extend({}, @params, options or {})

    post: (options) ->
      deferred = $q.defer()
      if @$resource
        @$resource.post(@getParams(options)).then (response) =>
          @populateData(response.data)
          if @$resource.route == 'attachments'
            @savedData['originalApiData'] = angular.copy response.data
          #emit the response object since we also require other info besides the data attribute
          $rootScope.$emit 'grid:loaded', { data: response }

          response.data
      else
        promise = deferred.promise
        deferred.resolve @data
        $rootScope.$emit 'grid:loaded', { data: response }

        promise

    fetch: (options) ->
      deferred = $q.defer()
      if @$resource
        @$resource.getList(@getParams(options)).then (response) =>
          @populateData(response)
          if @$resource.route == 'attachments'
            @savedData['originalApiData'] = angular.copy response
          $rootScope.$emit 'grid:loaded', { data: response }

          response
      else
        promise = deferred.promise
        deferred.resolve @data
        $rootScope.$emit 'grid:loaded', { data: response }

        promise

    refresh: () =>
      $rootScope.$broadcast 'refresh_grid'

    modifyGridData: (data) =>
      $rootScope.$emit 'modify_grid_data', { data: data}

    updateSavedData: (key, data) =>
      @savedData[key] = data

    setRowTemplate: (templateName) =>
      @gridOptions.rowTemplate = "shared/ui-grid-row-templates/#{templateName}.html"

    enableDateFiltering: =>
      @enable_date_filtering = true

    enableFetchRecords: =>
      @enable_fetch_records = true

    usePostMethod: =>
      @use_post_method = true

    onlyFetchDataAsGrid:=>
      @only_fetch_data_as_grid = true

    isOnlyFetchDataAsGridEnabled: =>
      if @only_fetch_data_as_grid then true else false

    isPostMethodEnabled: =>
      if @use_post_method then true else false

    isDateFilteringEnabled: =>
      if @enable_date_filtering then true else false

    isFetchRecordsEnabled: =>
      if @enable_fetch_records then true else false

    setGridNullLabel: (label) =>
      @gridOptions.groupingNullLabel = label

    disableSaveState : =>
      @gridOptions.enableSaveState = false

  new class GridResourceService
    $new: (options) ->
      new GridResource(options)
