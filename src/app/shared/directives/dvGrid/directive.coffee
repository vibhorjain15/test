###
    Note to my future self: If and when you need to enable row selection
    add a higher priority directive of same name & add the "ui-grid-selection"
    attribute to the div tag which holds the grid using TERMINAL compilation
###
angular.module('diligenceVault').directive 'dvGrid', (uiGridConstants, debounce, $compile, $parse, $rootScope, Utils, $interval,
  uiGridExporterConstants, toaster, $timeout, GridStateDataService, uiGridExporterService) ->
  templateUrl: 'shared/directives/dvGrid/template.html'
  scope: true
  replace: true
  link: ($scope, element, attrs) ->
    onRegisterApiCallbacks = []
    page_size = Utils.getRecordsPerPageNum()
    filtersTimeout = undefined
    defaults =
      enableSorting: true
      saveScroll: false
      saveFocus: false
      savePagination:false
      saveFilter: false
      savePinning: false
      saveSort: false
      saveSelection: false
      saveGroupingExpandedStates: false
      rowHeight: 40
      enableColumnMenus: false
      enableSaveState: true
      exporterExcelFilename: 'myFile.xlsx'
      exporterExcelSheetName: 'Sheet1'
      exporterFieldCallback : ( grid, row, col, value )=>
        if Array.isArray(value)
          value.toString()
        else
          value
      minRowsToShow: 10 + 1 # the height calculation works if you add + 1, temporary fix until it's fixed in ui-grid
      paginationPageSize: page_size
      paginationPageSizes: [
        10
        25
        50
      ]
      enableHorizontalScrollbar: 1
      enableVerticalScrollbar: 2
      onRegisterApi: (gridApi) ->
        if attrs.name?
          $parse(attrs.name).assign($scope.$parent, gridApi)

        $scope.gridApi = gridApi
        angular.forEach onRegisterApiCallbacks, (cb) -> cb(gridApi)

        _($scope.gridOptions.columnDefs).each (column)=>
          if column.enableFiltering
            column['filterHeaderTemplate'] = "shared/ui-grid-header-templates/custom-filter-template.html"

        filterChanged = false
        # if we use the filterChanged event alone it won't
        # work since it's launched before the rows are actually filtered
        # so we do all the action in rowsVisibleChanged
        $scope.gridApi.core.on.filterChanged $scope, =>
          $timeout =>
            filterChanged = true

        #replaced rowsVisibleChanged event with rowsRendered because the exact visible rows count was not returned inside the
        #rowsVisibleChanged event
        $scope.gridApi.core.on.rowsRendered $scope, =>
          if !filterChanged
            return
          filterChanged = false

          div = document.createElement("div")
          width = $(window)[0].outerWidth
          # get width from grid header
          #when row selection is enabled, the grid's first ui-grid-header-canvas class will have the select all checkbox
          #and the second ui-grid-header-canvas class will contain the main column headers, so we added the check for
          #both the cases.
          #when row selection is enabled, the headers will be inside the 2nd 'ui-grid-header-canvas' class, so
          #get the clientWidth from the second array element
          if ($scope.gridApi.grid.options.enableRowSelection or $scope.gridApi.grid.options.enableGrouping) and $(".ui-grid-header-canvas")[1].clientWidth
            width = $(".ui-grid-header-canvas")[1].clientWidth
          #when row selection is not enabled, the headers will be inside the 1st 'ui-grid-header-canvas' class, so
          #we get the clientWidth from the first array element
          else if !$scope.gridApi.grid.options.enableRowSelection and $(".ui-grid-header-canvas")[0].clientWidth
            width = $(".ui-grid-header-canvas")[0].clientWidth

          # create a new div to append inside ui grid view port
          $(div).attr('id','scrollableDiv')
          $(div).css("width", width+"px")
          # we need to provide some height otherwise it wont behave as a block element
          $(div).css("height","100px")

          # if there is no data
          # getting the filtered rows by looping through all the rows is time consuming, hence using the ui-grid provided
          # getVisibleRowCount method.
          if $scope.gridApi.grid.getVisibleRowCount() == 0
            # make sure scrollableDiv div gets appended only once
            if !$("#scrollableDiv").length
              $( div ).appendTo("div[bind-scroll-horizontal] .ui-grid-viewport")
          else
            # remove the appended div once the filter is removed
            $('#scrollableDiv').remove()

        $scope.gridApi.core.on.sortChanged $scope, (grid, sortColumns) ->
          if gridResource.isServerPaginated()
            if sortColumns[0]
              gridResource.params.sort_by = sortColumns[0].field
              gridResource.params.sort_direction = getSortDirection(sortColumns[0].sort.direction)
            else
              delete gridResource.params.sort_by
              delete gridResource.params.sort_direction

            loadPage(1)

        $scope.gridApi.pagination.on.paginationChanged $scope, (page_number, pageSize) ->

          if Utils.getRecordsPerPageNum() != pageSize
            Utils.setRecordsPerPageNum(pageSize)

          if gridResource.isServerPaginated()
            if gridResource.isServerFilterable()
              filters = getFilters(@grid)
              loadPage(page_number, filters)
            else
              loadPage(page_number)

        if $scope.gridApi.selection
          $scope.gridApi.selection.on.rowSelectionChangedBatch $scope, (rows) =>
            if $scope.$parent.vm.toggleSelectAll
              $scope.$parent.vm.toggleSelectAll($scope.gridApi,rows)


        if gridResource.isDateFilteringEnabled() || gridResource.isFetchRecordsEnabled
          $scope.fetchRecords = fetchRecords
          $scope.$parent.vm.DvGridController = $scope

    $scope.alphabets = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    $scope.active_alphabet_filter = undefined

    dvGridOptions = $scope.$eval(attrs.dvGridOptions)
    gridOptions = angular.extend({}, defaults, dvGridOptions or {})
    gridResource = $scope.$eval(attrs.gridResource)

    $scope.showAlphabetFilteringPanel = gridResource.isAlphabetFilteringEnabled()

    $scope.$on 'refresh_grid', =>
      $scope.getLatestData()

    $rootScope.$on 'modify_grid_data', (event, args) =>
      gridOptions.data = args.data
#      $scope.gridApi.grid.modifyRows(args.data)
      $scope.gridApi.core.refresh()

    triggerOnload = (response) ->
      if attrs.onload?
        $scope.$parent.$eval attrs.onload, {response: response}

    restoreGridState = ->
      name = $scope.$eval(attrs.gridName)
      $scope.gridApi.saveState.restore($scope, GridStateDataService.getGridState(name)) if GridStateDataService.getGridState(name)

    filterDataByFirstAlphabet = (response) ->
      alphabetical_response = {}
      for data in response
        alphabet = data.name.charAt(0).toUpperCase()
        if !alphabetical_response[alphabet]
          alphabetical_response[alphabet] = []
        alphabetical_response[alphabet].push data
      filtered_response_data = alphabetical_response[gridResource.params.begins_with.toUpperCase()]
      if !filtered_response_data
        filtered_response_data = []
      return filtered_response_data
    
    fetchRecords = (options) ->
      $scope.loading = true
      response_data = []
      #if post method is enabled for resource the call the post api otherwise call fetch api
      if options
        $scope.post_options = options
      if gridResource.isPostMethodEnabled()
        gridResource.post($scope.post_options).then((response) ->
          if gridResource.params.begins_with
            response_data = filterDataByFirstAlphabet(response)
          else
            response_data = response
          triggerOnload(response_data)
          gridResource.data = response_data
          $scope.gridOptions.data = gridResource.data
          currentSaveFilterValue = $scope.gridOptions.saveFilter
          $scope.gridOptions.saveFilter = false
          saveDefaultState()
          restoreGridState()
          $scope.gridOptions.saveFilter = currentSaveFilterValue
          $scope.loading = false
          response_data
        ,(error) ->
          $scope.loading = false
        )
      else if gridResource.isOnlyFetchDataAsGridEnabled()
        response_data = gridResource.params.entities
        triggerOnload(response_data)
        gridResource.data = response_data
        $scope.gridOptions.data = gridResource.data
        $scope.loading = false
        response_data
      else
        gridResource.fetch(options).then((response) ->
          triggerOnload(response)
          $scope.gridOptions.data = gridResource.data
          currentSaveFilterValue = $scope.gridOptions.saveFilter
          $scope.gridOptions.saveFilter = false
          saveDefaultState()
          restoreGridState()
          $scope.gridOptions.saveFilter = currentSaveFilterValue
          $scope.loading = false
          response
        ,(error) ->
          $scope.loading = false
        )
    
    saveDefaultState = =>
      $scope.defaultState = $scope.gridApi.saveState.save() if !$scope.defaultState

    loadPage = (page_number, options) ->
      $scope.loading = true
      gridResource.loadPage(page_number, options).then (response) ->
        triggerOnload(response)
        ###gridOptions.paginationCurrentPage = gridResource.pagination_meta.pageNumber###
        gridOptions.totalItems = gridResource.pagination_meta.totalRecords
        $scope.loading = false

    loadAllData = () ->
      if !$scope.loading
        $scope.loading = true
        toaster.pop 'success', 'Your file will start downloading automatically.'
        gridResource.loadAllData().then (response) ->
          $scope.loading = false
          # Now, it makes sense to turn off external pagination and external sorting,
          # as all the data is now present within AngularJS
          gridOptions.useExternalPagination = false
          gridOptions.useExternalSorting = false
          loadPage = angular.noop
          response

    setAllDataFn = ->
      if gridResource.isServerPaginated()
        gridOptions.exporterAllDataFn = loadAllData
      else
        gridOptions.exporterAllDataFn = fetchRecords

    getFilters = (grid) ->
      filterable_columns = _(grid.columns).where(enableFiltering: true)
      filters = {}

      _(filterable_columns).each (column) ->
        filter = column.filters[0] #we'll implement the advanced logic when in future if we need multiple filter objects

        if filter?
          filters[column.name] = filter.term

      filters

    applyFilters = ->
      if filtersTimeout
        $timeout.cancel filtersTimeout

      filtersTimeout = $timeout( =>
        filters = getFilters(@grid) #this method is run in the context of the grid
        if gridResource.isServerPaginated()
          loadPage(null, filters)
        else
          fetchRecords(filters)
      , 750)

    getSortDirection = (directionParam) ->
      direction = ''
      if directionParam == 'desc'
        direction = 'Descending'
      else if directionParam == 'asc'
        direction = 'Ascending'

      direction

    disablePdfMenu = () ->
      gridOptions.exporterMenuPdf = false

    disableCsvMenu = () ->
      gridOptions.exporterMenuCsv = false

    enableSaveStateButtons = (gridApi)->
      $interval (->
        gridApi.core.addToGridMenu( gridApi.grid, [
          {
            title: 'Save Current View',
            action: ->
              $scope.saveCurrentState()
          }
          {
            title: 'Restore Default View',
            action: ->
              $scope.resetToDefaultState()
          }
          {
            title: 'Delete Saved View',
            action: ->
              $scope.deleteSavedView()
          }
        ])
      ), 0, 1

    enableCustomDownloadMenu = (gridApi) ->
      $interval (->
        gridApi.core.addToGridMenu( gridApi.grid, [
          {
            title: 'Download as PDF'
            action: () ->
              $scope.gridApi.exporter.pdfExport uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE
          }
        ])
        gridApi.core.addToGridMenu( gridApi.grid, [
          {
            title: 'Download as CSV'
            action: () ->
              #code similar to the csvExport method in ui-grid, only passing exporterOlderExcelCompatibility as true to fix the unicode issue
              #reference: https://github.com/angular-ui/ui-grid/blob/84825bf6b75bd0403a206561d7699abe955eab80/packages/exporter/src/js/exporter.js#L856
              rowTypes = uiGridExporterConstants.ALL;
              colTypes = uiGridExporterConstants.VISIBLE;
              exportColumnHeaders = if this.grid.options.showHeader then uiGridExporterService.getColumnHeaders(this.grid, colTypes) else [];
              exportData = uiGridExporterService.getData(this.grid, rowTypes, colTypes);
              csvContent = uiGridExporterService.formatAsCsv(exportColumnHeaders, exportData, this.grid.options.exporterCsvColumnSeparator);

              fileName = if angular.isFunction(this.grid.options.exporterCsvFilename) then this.grid.options.exporterCsvFilename(grid, rowTypes, colTypes) else this.grid.options.exporterCsvFilename;
              uiGridExporterService.downloadFile(fileName, csvContent, this.grid.options.exporterCsvColumnSeparator, true, this.grid.options.exporterIsExcelCompatible);
          }
        ])
      ), 0, 1

    loadDynamicGridColumns = (gridApi) =>
      $timeout =>
        for column in gridApi.grid.options.columnDefs
          if !column.emptyTitle
            $scope.gridApi.core.addToGridMenu( $scope.gridApi.grid, [
              {
                title: column.displayName
                context: column
                icon: 'ui-grid-icon-ok color-success'
                leaveOpen: true
                action: (event,title) ->
                  if @grid.getVisibleColumnCount() > 1
                    @context.visible = !@context.visible
                  gridApi.grid.refresh()
                shown: () ->
                  if $scope.gridApi.grouping
                    grouping = $scope.gridApi.grouping.getGrouping()
                    isGroupedByThisColumn = grouping.grouping.length > 0 and grouping.grouping[0].field == @context.groupedColumnName
                    if @context.isOriginal
                      !isGroupedByThisColumn and @context.visible
                    else if @context.isDuplicate
                      isGroupedByThisColumn and @context.visible
                    else
                      @context.visible
                  else
                    @context.visible
              }
              {
                title: column.displayName
                context: column
                icon: 'ui-grid-icon-cancel color-danger'
                leaveOpen: true
                action: (event,title) ->
                  @context.visible = !@context.visible
                  gridApi.grid.refresh()
                shown: () ->
                  if $scope.gridApi.grouping
                    grouping = $scope.gridApi.grouping.getGrouping()
                    isGroupedByThisColumn = grouping.grouping.length > 0 and grouping.grouping[0].field == @context.groupedColumnName
                    if @context.isOriginal
                      !isGroupedByThisColumn and !@context.visible
                    else if @context.isDuplicate
                      isGroupedByThisColumn and !@context.visible
                    else
                      !@context.visible
                  else
                    !@context.visible
              }
            ])
      , 500

    disableDefaultExportMenu = () ->
      disableCsvMenu()
      disablePdfMenu()

    if gridResource?
      angular.extend(gridOptions, gridResource.gridOptions)
      if gridResource.isFilteringEnabled()
        gridOptions.enableFiltering = true #can be disabled by button toggle
        gridOptions.enableGridMenu = true
        gridOptions.gridMenuShowHideColumns = if gridResource.isGridShowHideColumnEnabled() then true else false
        gridOptions.gridMenuCustomItems = [
          {
            title: 'Toggle Filtering',
            action: ->
              $scope.toggleFiltering()
          }
        ]
        $scope.allow_filter_toggle = true

      if gridResource.isServerPaginated()
        gridOptions.useExternalPagination = true
        # As grouping is not working with external pagination, we did like this
        # Until, we find a solution, if server side pagination is required with grouping
        # we need to disable external sorting
        gridOptions.useExternalSorting = if gridResource.isExternalSortDisabled() then false else true

      onRegisterApiCallbacks.push (gridApi) ->
        enableSaveStateButtons(gridApi)
        loadDynamicGridColumns(gridApi)

      if gridResource.isServerFilterable()
        gridOptions.useExternalFiltering = true
        onRegisterApiCallbacks.push (gridApi) ->
          gridApi.core.on.filterChanged $scope, applyFilters

      if gridOptions.enableGrouping
        onRegisterApiCallbacks.push (gridApi) =>
          gridApi.grid.registerDataChangeCallback =>
            gridApi.core.refresh()
            return

      if gridResource.isExportEnabled()
        gridOptions.enableGridMenu = true
        disableDefaultExportMenu()
        onRegisterApiCallbacks.push (gridApi) =>
          enableCustomDownloadMenu(gridApi)

    $scope.gridOptions = gridOptions

    if gridOptions
      tpl = """
        <div ui-grid="gridOptions"
             ui-grid-pagination
             ui-grid-resize-columns
             ui-grid-move-columns
             #{if gridOptions.enableRowSelection then 'ui-grid-selection' else ''}
             #{if gridOptions.enableGrouping then 'ui-grid-grouping' else ''}
             #{if gridOptions.enableExport then 'ui-grid-exporter' else ''}
             #{if gridOptions.enableSaveState then 'ui-grid-save-state' else ''}></div>
      """
      ###element.append($compile(tpl)($scope))###
      element.find('.js-grid-elem').append($compile(tpl)($scope))

    $scope.toggleFiltering = ->
      $scope.gridOptions.enableFiltering = !$scope.gridOptions.enableFiltering
      $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN)

    if gridResource
      angular.extend($scope.gridOptions, gridResource.gridOptions)

      $scope.gridOptions.columnDefs = gridResource.columnDefs
      $scope.gridOptions.data = gridResource.data

      if gridResource.isServerPaginated()
        loadPage(1)
      else
        fetchRecords()

      setAllDataFn()

    $scope.saveCurrentState = ->
      name = $scope.$eval(attrs.gridName)
      currentSaveFilterValue = $scope.gridOptions.saveFilter
      $scope.gridOptions.saveFilter = false
      GridStateDataService.saveState(name, $scope.gridApi.saveState.save()).then (response)=>
        toaster.pop 'success','','View Saved Successfully'
        $scope.gridOptions.saveFilter = currentSaveFilterValue

    $scope.resetToDefaultState = ->
      currentSaveFilterValue = $scope.gridOptions.saveFilter
      $scope.gridOptions.saveFilter = false
      $scope.gridApi.saveState.restore($scope, $scope.defaultState)
      toaster.pop 'success','','View Restored to Default'
      $scope.gridOptions.saveFilter = currentSaveFilterValue


    $scope.deleteSavedView = ->
      $scope.resetToDefaultState()
      currentSaveFilterValue = $scope.gridOptions.saveFilter
      $scope.gridOptions.saveFilter = false
      name = $scope.$eval(attrs.gridName)
      GridStateDataService.saveState(name, {}).then (response)=>
        toaster.pop 'success','','View Removed Successfully'
        $scope.gridOptions.saveFilter = currentSaveFilterValue


    $scope.applyAlphabeticalFilters = (alphabet) =>
      $scope.active_alphabet_filter = alphabet
      gridResource.params.begins_with = alphabet
      if gridResource.isServerPaginated()
        loadPage(1)
      else
        fetchRecords()

    $scope.getLatestData = ->
      if gridResource.isServerPaginated()
        loadPage(1)
      else
        fetchRecords()
