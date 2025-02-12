class DiligenceDocumentsController extends BaseController
  @register 'DiligenceDocumentsController'

  @inject 'DocumentsResource', 'ModalFactory', 'SweetAlert', 'Restangular', 'toaster', 'Utils', '$state', 'hierarchyConstants',
    'BaseDataService', '$timeout', '$scope', 'baseUrl' ,'$http' , 'DocumentsService', '$q', '$rootScope', 'DocumentSearchService','PopupCheckerService',

  initialize: ->
    @current_user = @Utils.getCurrentUser()
    @global_hierarchy_option = @hierarchyConstants.Strategy
    @subscription = @Utils.getSubscriptionLevel()
    @freeSubscription = @Utils.isFreeSubscription()
    @isFreeManager = @Utils.isFreeManager()
    @bulkDownloadArr =  []
    @isSearchPanelCollapsed = true
    @initGridSection = false
    @searchText = @$state.params.q || ''
    @isSearchResults = (@$state.params.status == 'Search')
    @previewClicked = false

    @minDate = moment().subtract(5,'years').toDate()
    @maxDate = new Date()

    @getFirmPref()
    @searchResultTemplateUrl = 'shared/ui-grid-cell-templates/search-result-popover.html'
    @globalTernaryOperator = 'and'
    @searchCriteria = [{}]
    @dateFormat = 'MM-DD-YYYYTHH:mm:ss'
    @dateDisplayFormat = 'MM-DD-YYYY'
    @maxDate = new Date()
    @initializeSearchDetails = true
    @filterParams = {}
    @oldQueryText = ''
    @oldGlobalOperator = 'and'

    # @$rootScope.$on 'modal.closed', (ev) =>
    #   @refreshGrid()

    @$scope.headerButtonClick = (ev) ->
      return

    @documentsChardinConfig =
      scroll_to_target: true
      intros: [
        {
          target: '.ui-grid-column-menu-button:first'
          visible_elements: '.ui-grid-column-menu-button:first'
          intro: "Column Menu: Use this option to group/ungroup, show/hide and sort different columns"
          position: "right"
        }
        {
          target: '.ui-grid-menu-button'
          visible_elements: '.ui-grid-menu-button'
          intro: 'Grid Menu: Use this menu to show/hide different columns'
          position: 'right'
        }
      ]

    @criteriaOptions = [
      {
        text: 'Keyword'
        responseType: 'Text'
        id: 'q'
      }
      {
        text: 'As of Date'
        responseType: 'Date'
        id: 'as_of_date'
      }
      {
        text: 'Document Type'
        responseType: 'Dropdown'
        id: 'type_ids'
      }
      {
        text: 'Associated Firm'
        responseType: 'Dropdown'
        id: 'firm_ids'
      }
      {
        text: 'Associated Strategy'
        responseType: 'Dropdown'
        id: 'strategy_ids'
      }
      {
        text: 'Associated Product'
        responseType: 'Dropdown'
        id: 'fund_ids'
      }
      {
        text: 'Associated Vehicle'
        responseType: 'Dropdown'
        id: 'vehicle_ids'
      }
    ]

    @$rootScope.$on 'grid:loaded', (event, args) =>
      if args?.data.route == 'attachments' or args?.data.route == 'attachments/search'
        if @initializeSearchDetails
          @initializeSearchDetails = false
          @filterDetails.then (filterDetails) =>
            # For initialization of the DocumentSearch service, since once initialization is complete, we don't need to
            # reinitialize it
            if !@documentSearch
              options =
                documents: @documents.data
                documentTypes: filterDetails[0]
                allFirmsList: filterDetails[1].results
                allFundsList: filterDetails[2]
              @documentSearch = @DocumentSearchService.$new(options)
            # When query search is made, then we need to update the documents present in DocumentSearch service
            else
              #set original documents along with documents for the documents search, otherwise when the filters are removed
              #it will get the first loaded documents and will miss the documents loaded later using the date range.
              @documentSearch.setDocuments(@documents.data)
              @documentSearch.setOriginalDocuments(@documents.data)

            @performFilteringAndUpdateGrid()

    @$rootScope.$on 'Grid:Group', (event, args) =>
      @documentsGrid.grouping.clearGrouping()
      @closeQuickActions()
      if args.fieldName == 'group_names'
        args.fieldName = 'group_name'
      @documentsGrid.grouping.setGrouping({grouping: [{colName: args.fieldName, field: args.fieldName, groupPriority: 0}]})

    @$rootScope.$on 'Grid:Ungroup', (event, args) =>
      @closeQuickActions()
      @documentsGrid.grouping.clearGrouping()

    @filterDetails = @getAllFilterDetails()

  applyMethod: (startDate,endDate)=>
    @initializeSearchDetails = true
    @$scope.vm.DvGridController.fetchRecords(
      {
        q: @searchText
        global_operator: 'and'
        start_date: startDate
        end_date: endDate
      }
    )

  getAllFilterDetails: () =>
    params =
      skip_pagination: true
    promises = []

    paramsStrategy =
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {}
      search_for: @global_hierarchy_option
    promises.push @BaseDataService.getAttachmentTypes()
    promises.push @Restangular.all('firms/monitor').customGET('', params)
    promises.push @Restangular.all('service/dvapi_service/product_search').post(paramsStrategy)
    promises.push @Restangular.all('funds').customGET('', params)
    promises.push @Restangular.all('vehicles').getList()
#    promises.push @Restangular.all('tags').getList(type: 'Attachments')

    @$q.all(promises).then (responses) =>
      @attachmentTypes = responses[0]
      @criteriaOptions[2].childOptions = responses[0]

      @firms = responses[1]
      @criteriaOptions[3].childOptions = responses[1]

      @strategies = responses[2].data
      @criteriaOptions[4].childOptions = responses[2].data

      @funds = responses[3]
      @criteriaOptions[5].childOptions = responses[3]

      @vehicles = responses[4]
      @criteriaOptions[6].childOptions = responses[4]


#      @documentGroups = responses[3]
#      @criteriaOptions[5].childOptions = responses[3]

      if !@Utils.hideGroupByIntro() and (@Utils.getGroupByIntroDisplayOption() == undefined or !@Utils.getGroupByIntroDisplayOption() == false)
        @ModalFactory.invokeModal 'group_by_help'

      @setGridGroupingNullLabel('Ungrouped')
      # @setGridExcelExport(false)
      # @setGridExportAllDataFn()
      # @removeGridPdfExport()
      @documentsGrid.grouping.on.groupingChanged @$scope, (col) =>
        gridOptions = @documentsGrid.grid.appScope.gridOptions
        #We use the group_name column to display the grouped data and group_names column to display the ungrouped data
        if col.field == 'group_name' and _.isEmpty(col.grouping)
          #if the grid is not grouped by group_name
          gridOptions.columnDefs[10].visible = false                 #hide the group_name column
          gridOptions.columnDefs[11].visible = true                  #show the group_names column
          gridOptions.data = @documents.savedData.originalApiData   #use the original data
          @updateSearchDataAndPerformSearch {data: angular.copy @documents.savedData.originalApiData}
        if (col.field == 'group_names' or col.field == 'group_name') and !_.isEmpty(col.grouping)
          #if the grid is grouped by group_name
          gridOptions.columnDefs[10].visible = true                  #show the group_name column
          gridOptions.columnDefs[11].visible = false                 #hide the group_names column
          gridOptions.data = @documents.savedData.groupedData       #use the grouped data
          @updateSearchDataAndPerformSearch {data: angular.copy @documents.savedData.groupedData}
        ###**********************************IMPORTANT**********************************
        the array indexes 7 and 8 used above is the order in which it is defined in the grid resource.
        if column order is changed, or if new columns are added before these columns, please update the array
        indexes above to the new one
        ###

      responses

  getFirmPref: =>
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      if response.default_daterange_months
        @documents = @DocumentsResource.$new({q: @searchText, global_operator: 'and',start_date: @Utils.formatDatetime(@customDateFilter.startDate),end_date: @Utils.formatDatetime(@customDateFilter.endDate)})
      else
        @documents = @DocumentsResource.$new({q: @searchText, global_operator: 'and'})
      @initGridSection = true

  getSignedURL: (entity) ->
    @DocumentsService.getSignedURL(entity)

  getContextValue: (grid, row, col) ->
    return @DocumentsService.documentGroupName(grid, row, col)

  displayDocumentGroupName: (grid, row, col) ->
    return @DocumentsService.getDocumentGroupName(grid, row, col)

  displayGroupName: (grid, row, col) ->
    return @DocumentsService.getGroupName(grid, row, col)

  displayGroupHeaderName: (grid,row,col) ->
    return @DocumentsService.getGroupHeaderName(grid, row, col)

  formatTagsTooltip: (tagsList) ->
    @DocumentsService.formatTagsTooltip(tagsList)

  toggleSearchPanel: () ->
    @isSearchPanelCollapsed = not @isSearchPanelCollapsed
    if @isSearchPanelCollapsed
      @keepAppliedFilters()

  setGridGroupingNullLabel: (label) =>
    @documentsGrid.grid.appScope.gridOptions.groupingNullLabel  = label

  setGridExcelExport: (value) =>
    @documentsGrid.grid.appScope.gridOptions.exporterMenuExcel = value

  setGridExportAllDataFn: () =>
    @documentsGrid.grid.appScope.gridOptions.exporterAllDataFn = null

  removeGridPdfExport: () =>
    @documentsGrid.grid.gridMenuScope.registeredMenuItems.forEach (menuItem) ->
      if menuItem.title == 'Download as PDF'
        menuItem.shown = () ->
          return false

  selectCriteria: (criteria, index) =>
    @searchCriteria[index].value = ''
    @selectDefault(criteria, index)

  addNewCriteria: =>
    @searchCriteria.push({})
    @searchForm.$setPristine()

  removeCriteria: () =>
    @searchCriteria.splice(@searchCriteria.length - 1, 1)
    @searchForm.$setPristine()

  selectDefault: (criteria, index) =>
    criteria.condition = 'equals'

  updateSearchDataAndPerformSearch: (args) =>
    @documentSearch.setDocuments(args.data)
    @documentSearch.setOriginalDocuments(args.data)
    @performFilteringAndUpdateGrid()

  createSearchQuery: () =>
    params =
      global_operator: @globalTernaryOperator

    _(@searchCriteria).each((criteria) =>
      switch criteria.criteriaObj.text
        when 'Keyword'
          params.q = criteria.value
        when 'As of Date'
          if criteria.condition == 'equals'
            params.eq_as_of_date = moment(criteria.value).startOf('day').format(@dateFormat)
          if criteria.condition == 'greater_than'
            params.gt_as_of_date = moment(criteria.value).startOf('day').format(@dateFormat)
          if criteria.condition == 'lesser_than'
            params.lt_as_of_date = moment(criteria.value).endOf('day').format(@dateFormat)
        when 'Document Type'
          params.type_ids = criteria.value
        when 'Document Group'
          params.group_ids = criteria.value
        when 'Associated Firm'
          params.firm_ids = criteria.value
          params.entity_type = 'Firm'
        when 'Associated Strategy'
          params.strategy_ids = criteria.value
          params.entity_type = 'Strategy'
        when 'Associated Product'
          params.fund_ids = criteria.value
          params.entity_type = 'Fund'
        when 'Associated Vehicle'
          params.vehicle_ids = criteria.value
          params.entity_type = 'Vehicle'
    )

    params

  keepAppliedFilters: () =>
    @searchCriteria = @searchCriteria.filter (criterion) =>
      if criterion.criteriaObj
        criterionId = criterion.criteriaObj.id
        if criterionId == 'as_of_date'
          if criterion.condition == 'equals'
            return 'eq_as_of_date' of @filterParams
          else if 'greater_than'
            return 'gt_as_of_date' of @filterParams
          else if 'lesser_than'
            return 'lt_as_of_date' of @filterParams
        else
          return criterionId of @filterParams

    if !@searchCriteria.length
      @resetFiltersData()


  getSearchResults: =>
    return unless @searchForm.$valid

    @isSearchPanelCollapsed = true
    @initializeFiltering()

  initializeFiltering: () =>

    @filterParams = @createSearchQuery()

    # Whenever keyword search is used, delete the @documents and provide a timeout to refresh the grid and initialize
    # it with new documents provided from DocumentsResource
    keywordParam = if @filterParams.q then @filterParams.q else ''
    globalOperator = @filterParams.global_operator
    if @oldQueryText != keywordParam or ('q' of @filterParams and @filterParams.global_operator == 'or') or @oldGlobalOperator != globalOperator
      @reinitializeDocumentsGrid()
      @oldQueryText = keywordParam
      @oldGlobalOperator = globalOperator
    # We can perform filter operation in previously present documents
    else
      @performFilteringAndUpdateGrid()

  reinitializeDocumentsGrid: () =>
    @initGridSection = false
    @initializeSearchDetails = true
    searchText = if @filterParams?.q then @filterParams.q else ''
    delete @documents
    queryParams = {}
    if @globalTernaryOperator == 'or'
      queryParams =
        q: searchText
        gt_as_of_date: @filterParams.gt_as_of_date
        lt_as_of_date: @filterParams.lt_as_of_date
        eq_as_of_date: @filterParams.eq_as_of_date
        fund_ids: @filterParams.fund_ids
        vehicle_ids: @filterParams.vehicle_ids
        firm_ids: @filterParams.firm_ids
        strategy_ids: @filterParams.strategy_ids
        group_ids: @filterParams.group_ids
        type_ids: @filterParams.type_ids
        global_operator: @globalTernaryOperator
    if @globalTernaryOperator == 'and'
      queryParams =
        q: searchText
        global_operator: @globalTernaryOperator

    if @customDateFilter.selectedRange == 'No Filter'
      queryParams.start_date = null
      queryParams.end_date   = null
    else
      queryParams.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      queryParams.end_date = @Utils.formatDatetime(@customDateFilter.endDate)

    @documents = @DocumentsResource.$new(queryParams)
    @$timeout (=>
      @initGridSection = true
      @documentsGrid.selection.clearSelectedRows()
    ), 100
    # Second timeout to set GroupingNullLabel, using it in the above $timeout didn't work
    # Hence, added another timeout
    @$timeout (=>
      @setGridGroupingNullLabel('Ungrouped')
      # @setGridExcelExport(false)
      # @setGridExportAllDataFn()
      # @removeGridPdfExport()
    ), 400

  performFilteringAndUpdateGrid: () =>
    documents = @documentSearch.filterDocuments(@filterParams)
    @documents.modifyGridData(documents)
    @documentsGrid.selection.clearSelectedRows()

  resetFiltersData: () =>
    @oldQueryText = ''
    @oldGlobalOperator = 'and'
    @globalTernaryOperator = 'and'
    @filterParams = {}
    @documentSearch.resetToOriginalDocuments()
    @performFilteringAndUpdateGrid()
    @searchCriteria = [{}]
    @searchForm.$setPristine()
    @documentsGrid.selection.clearSelectedRows()

  refreshGrid: () =>
    @initializeSearchDetails = true
    if @customDateFilter.selectedRange == 'No Filter'
      start_date = null
      end_date   = null
    else
      start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      end_date = @Utils.formatDatetime(@customDateFilter.endDate)

    @$scope.vm.DvGridController.fetchRecords(
      {
        q: @searchText
        global_operator: 'and'
        start_date: start_date
        end_date: end_date
      }
    )

  showFilters: () =>
    @searchCriteria.length > 0 and @searchCriteria[0].value? and @isSearchPanelCollapsed

  displayFilter: (criterion) =>

    displayedFilter = ''

    switch criterion.criteriaObj.text
      when 'Keyword'
        displayedFilter = 'Keyword: ' + criterion.value
      when 'As of Date'
        if criterion.condition == 'equals'
          displayedFilter = 'As of Date = ' + moment(criterion.value).format(@dateDisplayFormat)
        else if criterion.condition == 'greater_than'
          displayedFilter = 'As of Date > ' + moment(criterion.value).format(@dateDisplayFormat)
        else if criterion.condition == 'lesser_than'
          displayedFilter = 'As of Date < ' + moment(criterion.value).format(@dateDisplayFormat)
      when 'Document Type'
        displayedFilter = 'Type: ' +
        _.chain(@attachmentTypes).filter((type) ->
          type.id in criterion.value
        ).map((type) ->
          type.name
        ).join(', ')
        .value()
      when 'Document Group'
        displayedFilter = 'Group: ' +
          _.chain(@documentGroups).filter((group) ->
            group.id in criterion.value
          ).map((group) ->
            group.name
          ).join(', ')
            .value()
      when 'Associated Firm'
        displayedFilter = 'Firm: ' +
          _.chain(@firms).filter((firm) ->
            firm.id in criterion.value
          ).map((firm) ->
            firm.name
          ).join(', ')
          .value()
      when 'Associated Strategy'
        displayedFilter = 'Strategy: ' +
          _.chain(@strategies).filter((strategy) ->
            strategy.id in criterion.value
          ).map((strategy) ->
            strategy.name
          ).join(', ')
          .value()
      when 'Associated Product'
        displayedFilter = 'Product: ' +
          _.chain(@funds).filter((fund) ->
            fund.id in criterion.value
          ).map((fund) ->
            fund.name
          ).join(', ')
            .value()
      when 'Associated Vehicle'
        displayedFilter = 'Vehicle: ' +
          _.chain(@vehicles).filter((vehicle) ->
            vehicle.id in criterion.value
          ).map((vehicle) ->
            vehicle.name
          ).join(', ')
            .value()

    displayedFilter

  removeFilterCriterion: (index) =>
    @searchCriteria.splice index, 1

    @initializeFiltering()

    if !@searchCriteria.length
      @resetFiltersData()

  showDocumentAction: (document) ->
    @Utils.isDocumentUploadByCurrentFirm(document.owner_firm_id)

  showPreviewIcon: (document) ->
    Boolean document.highlights? and Object.keys(document.highlights).length != 0

  addDocument: () ->
    unless @freeSubscription
      @ModalFactory.invokeModal 'manage_document',
        resolve:
          documentOptions: ->
            mode: 'update'
            source: 'all_documents'
            editAccessGranted: true
        success: (action) =>
          if action == 'refresh'
            @refreshGrid()
            @documentsGrid.selection.clearSelectedRows()

  openDocumentUpdateDialog: (document) ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: @showDocumentAction document
          mode: 'update'
          source: 'documentsEditClick'
          document: document
      success: (response) =>
        if response
          @refreshGrid()
          @resetFiltersData()
          @documentsGrid.selection.clearSelectedRows()

  openDocumentShareDialog: (attachment) ->
    attachment.attachment_id = attachment.id
    entityId = @current_user.firmInfo.id
    @ModalFactory.invokeModal 'share_document',
      resolve:
        document: -> attachment
        entityType: -> 'Firm'
        entityId: -> entityId
      success: (file) =>
        @refreshGrid()
        @resetFiltersData()
        @documentsGrid.selection.clearSelectedRows()

  confirmDocumentDeletion: (dd_document) ->
    title = 'Are you sure?'
    text = "If you have shared this document with other firms, they will still be able to see it. Please use update to add new versions."

    @SweetAlert.confirm({
      title: title
      text: text
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeDocument(dd_document)
    })

  removeDocument: (dd_document) ->
    @Restangular.one('attachments', dd_document.id).remove().then (=>
      @refreshGrid()
      @documentsGrid.selection.clearSelectedRows()
      @resetFiltersData()
      @toaster.pop 'success', '', 'Document deleted successfully'
      swal.close()
    ), ((error) =>
      swal.close()
    )


  downloadURI: (uri) =>
    link = document.createElement('a')
    link.href = uri
    document.body.appendChild link
    link.click()
    document.body.removeChild link

  downloadAllDocuments: () =>
    items_arr = []
    @bulkDownloadArr = {
      "user_id": @current_user.id
      "files": []
      "container_name": "firm#{@current_user.firmInfo.id}"
    }
    @toastInstance = @toaster.pop({type: 'info', title: 'Processing Your Files For Download...', body: 'Please wait while the zip file is being generated.', timeout: 0})
    items_arr = @documentsGrid.selection.getSelectedRows()
    grouping_structure = @documentsGrid.grouping.getGrouping()
    if grouping_structure.grouping.length > 0 and grouping_structure.grouping[0].colName
      @bulkDownloadArr.selected_group_name = grouping_structure.grouping[0].colName

    _(items_arr).each (item) =>
      itemsObj = {}
      itemsObj.as_of_date = item.as_of_date
      itemsObj.blob_name = item.blob_name
      itemsObj.container_name = item.container_name
      itemsObj.context = item.context
      itemsObj.created_at = item.created_at
      itemsObj.associated_Firm_Name = item.associated_Firm_Name
      itemsObj.created_by = item.created_by
      itemsObj.created_by_name = item.created_by_name
      itemsObj.entity_id = item.entity_id
      itemsObj.entity_type = item.entity_type
      itemsObj.group_ids = item.group_ids
      itemsObj.group_names = item.group_names
      itemsObj.id = item.id
      itemsObj.name = item.name
      itemsObj.owner_firm_id = item.owner_firm_id
      itemsObj.owner_firm_name = item.owner_firm_name
      itemsObj.source = item.source
      itemsObj.source_id = item.source_id
      itemsObj.tag_names = item.tag_names
      itemsObj.tags = item.tags
      itemsObj.updated_at = item.updated_at
      itemsObj.updated_by = item.updated_by
      itemsObj.updated_by_name = item.updated_by_name
      itemsObj.version = item.version
      itemsObj.associated_project_names = item.associated_project_names
      itemsObj.associated_template_names = item.associated_template_names
      itemsObj.associated_fund_names = item.associated_fund_names
      itemsObj.associated_strategy_names = item.associated_strategy_names
      itemsObj.associated_firm_names = item.associated_firm_names
      itemsObj.associated_vehicle_names = item.associated_vehicle_names
      itemsObj.is_reviewed = item.is_reviewed
      itemsObj.reviewed_by = item.reviewed_by
      itemsObj.review_count = item.review_count
      itemsObj.last_reviewed_date = item.last_reviewed_date
      @bulkDownloadArr.files.push itemsObj

    @$http.post(@baseUrl + '/service/dv_scheduler_service/download_blob', @bulkDownloadArr).then ((response) =>
      @toaster.clear(@toastInstance)
      @downloadURI(response.data.url)
    ), (error) =>
      @toaster.clear(@toastInstance)

  closeQuickActions: () =>
    @documentsGrid.selection.clearSelectedRows()
    items_arr = @documentsGrid.grid.rows

    _(items_arr).each (rows) =>
      rows.isSelected = false
      rows.entity.isSelected = false
      @documentsGrid.selection.unSelectRow(rows)

    jQuery('input[type="checkbox"]').each (ind) ->
      jQuery(this).prop 'checked', false
      return

    @$scope.vm.show_bulk_actions = false
    @documentsGrid.grid.appScope.vm.select_all = false

  toggleSelectAll: (gridApi,rows) =>
    #ui-grid handles the selectall
    #method recieves all the selected rows, loop through all the rows and check all of them group header rows
    angular.forEach rows, (row) =>
      if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
        row.treeNode.parentRow.isSelected = row.isSelected

    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @$scope.vm.show_bulk_actions = selectAll
    @documentsGrid.grid.appScope.vm.select_all = selectAll
    @totalSelectedRecords = selectedCount

  toggleButtonClick: (grid,row) =>
    #Normal row selection is handled by ui grid
    #But grouped rows we have to handle. Following conditions are for that.
    if row.internalRow
      angular.forEach row.treeNode.children,(children) =>     #loop over all the rows inside this group
        children.row.isSelected = false
        #select only visible rows
        if children.row.visible and row.isSelected
          children.row.isSelected = true             #and select all the rows inside that group

    #Below logic is used to select the group header row if all items inside the group are selected.
    else if row.treeNode.parentRow                            #if the row is a child inside a group
      row.treeNode.parentRow.isSelected = true                #Check the group header row
      angular.forEach row.treeNode.parentRow.treeNode.children,(children) =>
        if !children.row.isSelected                           #if any of the group's children are not checked
          row.treeNode.parentRow.isSelected = false           #then uncheck the group header row

    #Get the number of selected rows
    @totalSelectedRecords = grid.api.selection.getSelectedRows().length

    #Show/hide bulk actions depending on the number of selected rows.
    if @totalSelectedRecords > 0
      @$scope.vm.show_bulk_actions = true
    else
      @$scope.vm.show_bulk_actions = false

  generatePageUrl: (entity)=>
    pageUrl = ""
    if entity.associated_duediligences.length
      _(entity.associated_duediligences).each (duediligence,index)=>
        pageUrl += "app/diligence/projects/#{duediligence}/documents/#{entity.id}"
        pageUrl += "," if index != entity.associated_duediligences.length - 1
      pageUrl += "," if entity.associated_funds.length > 0 or entity.associated_firms.length > 0 or entity.associated_vehicles.length > 0
    if entity.associated_funds.length
      _(entity.associated_funds).each (fund,index)=>
        pageUrl += "app/funds/#{fund}/profile/documents/#{entity.id}"
        pageUrl += "," if index != entity.associated_funds.length - 1
      pageUrl += "," if entity.associated_firms.length > 0 or entity.associated_vehicles.length > 0
    if entity.associated_vehicles.length
      _(entity.associated_vehicles).each (vehicle,index)=>
        pageUrl += "app/vehicles/#{vehicle}/profile/documents/#{entity.id}"
        pageUrl += "," if index != entity.associated_vehicles.length - 1
      pageUrl += "," if entity.associated_firms.length > 0
    if entity.associated_firms.length
      _(entity.associated_firms).each (firm,index)=>
        pageUrl += "app/firms/#{firm}/profile/documents/#{entity.id}"
        pageUrl += "," if index != entity.associated_firms.length - 1
    if entity.hasOwnProperty('associated_strategies') && entity.associated_strategies.length
      _(entity.associated_strategies).each (strategy,index)=>
        pageUrl += "app/strategies/#{strategy}/profile/documents/#{entity.id}"
        pageUrl += "," if index != entity.associated_strategies.length - 1
      pageUrl += "," if entity.associated_strategies.length
    pageUrl

  openRow: (row,col)=>
    pageUrl = @generatePageUrl(row.entity)
    @DocumentsService.setDocumentPageUrl(pageUrl)
    if !row.internalRow && col.field != "selectionRowHeaderCol" && !@previewClicked && col.field != 'action'
      url = ""
      if !row.entity.attachment_id
        url = @$state.href("app.content.document.detail",{documentId: row.entity.id})
      else if row.entity.attachment_id
        url = @$state.href("app.content.document.detail",{documentId: row.entity.attachment_id})

      if @showFilters() || (@isSearchResults && @searchText.length && !row.entity.attachment_id)
        window.open(url,'_blank')
      else
        window.location.hash = url

    else if @previewClicked
      @previewClicked = false
