class ExcelSyncDetailController extends BaseController
  @register 'ExcelSyncDetailController'

  @inject 'Restangular', 'Utils', '$stateParams', '$scope', 'toaster', 'BaseDataService', '$http', 'baseUrl', '$window','PopupCheckerService', 'angularEnabled'

  initialize: ->
    @sync_type = @$stateParams.sync_type
    @transaction_id = @$stateParams.Id
    @disable_selected_all_products = false
    @isInvestor = @Utils.isInvestor()

    if @sync_type == 'download'
      @templates_list = []
      @products_list = []
      @getFirmPref()
      @getAllActiveDDs().then (response) =>
        @setInvestorsList()
        @setManagersList()
    else if (@sync_type == 'upload')
      @loadTransactionDetails()
      @loadTransactionDiligences()

  applyMethod: (startDate,endDate)=>
    @sortBetweenDates(startDate,endDate)

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      @defaultRange = angular.copy @customDateFilter
      @loading_prefs = false

  getAllActiveDDs: =>
    @Restangular.all('excel_sync/diligences').getList().then (response) =>
      @active_dds = _(response).filter (dd) ->
        dd.status != "Completed" && dd.status != "PendingRestart"

  loadTransactionDetails: =>
    @Restangular.one('ExcelSyncTransactions', @transaction_id).get().then (response) =>
      @transaction_details = response

  loadTransactionDiligences: =>
    @Restangular.all('ExcelsyncTransactionDiligences').customGET('', {transaction_id : @transaction_id}).then (response) =>
      @transaction_diligences = response
      for t in @transaction_diligences
        errors = JSON.parse(t.status_description)
        t.errors = errors

  goToPreviousPage: () ->
    if @$window.history.length > 1
      @$window.history.back()
    else
      @$stateParams.sync_type = 'download'
      @$state.go 'app.diligence.excel_sync.list'

  setInvestorsList: =>
    @active_investors = _(@active_dds).map (dd) ->
      {
        name: dd.fromfirm_name,
        id: dd.fromfirm_id
      }
    @active_investors = _.uniq(@active_investors, 'id')
    @active_investors = _(@active_investors).sortBy (investor) -> investor.name

  setManagersList: =>
    @active_managers = _(@active_dds).map (dd) ->
      {
        name: dd.tofirm_name,
        id: dd.tofirm_id
      }
    @active_managers = _.uniq(@active_managers, 'id')
    @active_managers = _(@active_managers).sortBy (manager) -> manager.name

  getDatesArray = (startDate, endDate) ->
    dates = []
    currentDate = startDate

    addDays = (days) ->
      date = new Date(@valueOf())
      date.setDate date.getDate() + days
      date

    while currentDate <= endDate
      dates.push currentDate
      currentDate = addDays.call(currentDate, 1)
    dates

  enumerateDaysBetweenDates = (startDate, endDate) ->
    now = startDate
    dates = []
    while now.isSameOrBefore(endDate)
      dates.push now.format('M/D/YYYY')
      now.add 1, 'days'
    dates

  sortBetweenDates: (startDate,endDate) =>
    if @copyOfProductList
      @products_list = JSON.parse(JSON.stringify(@copyOfProductList))
      if startDate and endDate
        startDate = moment(startDate)
        endDate = moment(endDate)
        datesArray =  enumerateDaysBetweenDates(startDate,endDate)
        testArr = []
        _(@products_list).each (product) =>
          product.created_at = moment(product.created_at)
          product.created_at = product.created_at.format('M/D/YYYY')
          if product.created_at in datesArray
            testArr.push product
        @products_list = testArr

  investorSelected: =>
    if @selected_investor
      @products_list = []
      @templates_list = []
      dds_list_by_investor = _(@active_dds).filter (dd) =>
        @selected_investor.id == dd.fromfirm_id
      templates_list_by_investor = _(dds_list_by_investor).map (dd) ->
        {
          name: dd.template_name,
          id: dd.template_id
        }
      @templates_list = _.uniq(templates_list_by_investor, 'id')
      @templates_list = _(@templates_list).sortBy (template) -> template.name

  managerSelected: =>
    if @selected_manager
      @products_list = []
      @templates_list = []
      dds_list_by_manager = _(@active_dds).filter (dd) =>
        @selected_manager.id == dd.tofirm_id
      templates_list_by_manager = _(dds_list_by_manager).map (dd) ->
        {
          name: dd.template_name,
          id: dd.template_id
        }
      @templates_list = _.uniq(templates_list_by_manager, 'id')
      @templates_list = _(@templates_list).sortBy (template) -> template.name

  investorTemplateSelected: (template) =>
    if @selected_template
      @products_list = []
      dds_list_by_investor = _(@active_dds).filter (dd) =>
        @selected_investor.id == dd.fromfirm_id

      dds_list_by_template = _(dds_list_by_investor).filter (dd) =>
        @selected_template.id == dd.template_id
      products_list_by_template = _(dds_list_by_template).map (dd) =>
        {
          entity_name: dd.entity_name,
          id: dd.entity_id,
          name:dd.name,
          tofirm_name:dd.tofirm_name,
          as_of_date:dd.as_of_date
          entity_type: dd.entity_type,
          created_at: dd.created_at,
          due_at:dd.due_at,
          dd_id: dd.id,
          display_name : @Utils.getDisplayEntityType(dd.entity_type)
        }
      @products_list = _.uniq(products_list_by_template, 'dd_id')
      @products_list = _(@products_list).sortBy (product) -> product.name
      @copyOfProductList = JSON.parse(JSON.stringify(@products_list))
      if @customDateFilter.selectedRange == 'No Filter'
        @sortBetweenDates(null,null)
      else
        @sortBetweenDates(@customDateFilter.startDate,@customDateFilter.endDate)

  managersTemplateSelected: (template) =>
    if @selected_template
      @products_list = []
      dds_list_by_manager = _(@active_dds).filter (dd) =>
        @selected_manager.id == dd.tofirm_id

      dds_list_by_template = _(dds_list_by_manager).filter (dd) =>
        @selected_template.id == dd.template_id
      products_list_by_template = _(dds_list_by_template).map (dd) =>
        {
          entity_name: dd.entity_name,
          id: dd.entity_id,
          name:dd.name,
          tofirm_name:dd.tofirm_name,
          as_of_date:dd.as_of_date
          entity_type: dd.entity_type,
          created_at: dd.created_at,
          due_at:dd.due_at,
          dd_id: dd.id,
          display_name : @Utils.getDisplayEntityType(dd.entity_type)
        }
      @products_list = _.uniq(products_list_by_template, 'dd_id')
      @products_list = _(@products_list).sortBy (product) -> product.name
      @copyOfProductList = JSON.parse(JSON.stringify(@products_list))
      if @customDateFilter.selectedRange == 'No Filter'
        @sortBetweenDates(null,null)
      else
        @sortBetweenDates(@customDateFilter.startDate,@customDateFilter.endDate)



  toggleProductSelection: (product, isSelected) =>
    product.is_selected = isSelected
    if(@getSelectedProducts().length == @products_list.length)
      @disable_selected_all_products = true
    else
      @disable_selected_all_products = false

  selectedAllProducts: =>
    for p in @products_list
      p.is_selected = true
    @disable_selected_all_products = true

  clearAllProducts: =>
    for p in @products_list
      p.is_selected = false
    @disable_selected_all_products = false

  goBack: =>
    @$window.history.back()

  getSelectedProducts: =>
    @selected_products_list = _(@products_list).filter (product) ->
      product.is_selected
    @selected_products_list

  resetFilter: ->
    @selected_investor = null
    @selected_template = null
    @products_list = []
    @customDateFilter = angular.copy @defaultRange


  processExcelSync: =>
    if @sync_type == 'download'
      if @excel_sync_download.$valid && @getSelectedProducts().length
        products_id_arr = _(@getSelectedProducts()).map (product) ->
          product.dd_id

        @toastInstance = @toaster.pop({type: 'info', title: 'Processing Excel Download...', body: 'Please wait while the excel file is being generated.', timeout: 0})
        if @isInvestor
          request_payload = {
              template_id : @selected_template.id,
              diligences : products_id_arr,
              investor_firm_id : @selected_manager.id
            }
        else
          request_payload = {
              template_id : @selected_template.id,
              diligences : products_id_arr,
              investor_firm_id : @selected_investor.id
            }
        @$http.post(@baseUrl + '/excel_sync/download', request_payload, {
          responseType:'arraybuffer'
        })
        .then ((response) =>
          octetStreamMime = 'application/octet-stream'
          success = false
          # Get the headers
          headers = response.headers()
          # Get the filename from the x-filename header or default to "download.bin"
          contentDisposition = response.headers('Content-Disposition')
          filename_from_header = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
          filename = filename_from_header or 'download.xlsx'
          # Determine the content type from the header or default to "application/octet-stream"
          contentType = headers['content-type'] or octetStreamMime
          try
          # Try using msSaveBlob if supported
            blob = new Blob([ response.data ], type: contentType)
            if navigator.msSaveBlob
              navigator.msSaveBlob blob, filename
            else
              # Try using other saveBlob implementations, if available
              saveBlob = navigator.webkitSaveBlob or navigator.mozSaveBlob or navigator.saveBlob
              if saveBlob == undefined
                throw 'Not supported'
              saveBlob blob, filename
            success = true
          catch ex
            # we need to add log this error to slack rather than printing it on browser console
            # console.log 'saveBlob method failed with the following exception:'
            # console.log ex
          if !success
            # Get the blob url creator
            urlCreator = window.URL or window.webkitURL or window.mozURL or window.msURL
            if urlCreator
              # Try to use a download link
              link = document.createElement('a')
              if 'download' of link
                # Try to simulate a click
                try
                # Prepare a blob URL
                  blob = new Blob([ response.data ], type: contentType)
                  url = urlCreator.createObjectURL(blob)
                  link.setAttribute 'href', url
                  # Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
                  link.setAttribute 'download', filename
                  # Simulate clicking the download link
                  event = document.createEvent('MouseEvents')
                  event.initMouseEvent 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null
                  link.dispatchEvent event
                  success = true
                catch ex
                  # we need to add log this error to slack rather than printing it on browser console
                  # console.log 'Download link method with simulated click failed with the following exception:'
                  # console.log ex
              if !success
                # Fallback to window.location method
                try
                # Prepare a blob URL
                # Use application/octet-stream when using window.location to force download
                  blob = new Blob([ response.data ], type: octetStreamMime)
                  url = urlCreator.createObjectURL(blob)
                  window.location = url
                  success = true
                catch ex
                  # we need to add log this error to slack rather than printing it on browser console
                  # console.log 'Download link method with window.location failed with the following exception:'
                  # console.log ex
          if !success
            # Fallback to window.open method
            popup = window.open httpPath, '_blank', ''
            PopupCheckerService.check(popup)
          @toaster.clear(@toastInstance)
          @resetFilter()
        ), (error) =>
          @toaster.clear(@toastInstance)
          @toaster.pop 'error', '', error.message
      else
        @toaster.pop 'error', '', 'Please select at least one project.'