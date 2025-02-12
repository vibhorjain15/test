class BulkActionsController extends BaseController
  @register 'BulkActionsController'

  @inject  'Restangular', 'toaster', 'FileHandlerFactory', 'Utils', '$http', 'PopupCheckerService', 'baseUrl', 'DueDiligenceDataservice', 'ERROR_CODES','angularEnabled', '$window'

  initialize: ->
    @allowed_file_extensions = ['.xls', '.xlsm', '.xlsx']
    @uploadType = {}
    @updatedParams = {}
    @user_id = @Utils.getCurrentFirm().id
    @current_firm_id = @Utils.getCurrentFirm().id
    @isBusinessAdmin = @Utils.isBusinessAdmin()
    @maxFileSize = '50MB'
    @drop_files = []
    @files = []
    @tabType = 'team_members'
    allowed_file_extensions = @FileHandlerFactory.getFileTypes()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    @onlyNewUploadSources = ['detail' , 'list' , 'documentsEditClick', 'firmDocumentsList']

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')
    @isManager = @Utils.isManager()
    if @isManager
      @$window.history.back()
      return

  downloadEmptySampleFile: =>
    @toastInstance = @toaster.pop({type: 'info', title: 'Downloading File', body: 'Please wait...', timeout: 0})
    @$http({
        url: @baseUrl + '/bulk_import/download',
        responseType: 'arraybuffer',
        method: "GET",
        params:
          download_blank:true
    }).then (response) =>
      @toaster.clear(@toastInstance)
      @processExcelFile(response)
    , (error)=>
      @toaster.clear(@toastInstance)

  downloadSampleFile: =>
    @toastInstance = @toaster.pop({type: 'info', title: 'Downloading File', body: 'Please wait...', timeout: 0})
    @$http({
        url: @baseUrl + '/bulk_import/download',
        responseType: 'arraybuffer',
        method: "GET"
    }).then (response) =>
      @toaster.clear(@toastInstance)
      if response.status == @ERROR_CODES.ACCEPTED
        @toaster.pop 'success','','Please check your email for the file. It may take upto 5 to 30 mins to generate the file.'
      else
        @processExcelFile(response)
    , (error)=>
      @toaster.clear(@toastInstance)

  addDocumentSubmit: () =>
    unless @files?.length
      @toaster.pop 'error', '', 'Please attach the excel file'
      return
    # 'Team Members', 'Firm Upload', 'Contact Upload', 'Fund Upload'
    selectedTypes = []
    if @uploadType.team_members and !@isBusinessAdmin
      selectedTypes.push 'TeamMember'
    if @uploadType.firms
      selectedTypes.push 'Firm'
    if @uploadType.funds
      selectedTypes.push 'Product'
    if @uploadType.contacts
      selectedTypes.push 'Contact'
    if @uploadType.vehicles
      selectedTypes.push 'Vehicle'
    if @uploadType.strategy
      selectedTypes.push 'Strategy'

    allowedExtensions = /(\.xls|\.xlsx)$/i;
    if !allowedExtensions.exec(@files[0].name)
      @toaster.pop 'error', '', 'Incorrect file type. Please select a correct Excel file'
      return

    if selectedTypes.length == 0
      @toaster.pop 'error', '', 'Please select types'
      return

    selectedTypesStr = selectedTypes.join()
    payload = new FormData()
    payload.append('file', @files[0])
    payload.append('types', selectedTypesStr)
    params = {types: selectedTypesStr}
    @uploading_excel = true
    @$http({
        url: @baseUrl + '/bulk_import/upload',
        data: payload
        headers:
          "Content-Type": undefined
        method: "POST"
    }).then (response) =>
      # @processExcelFile(response)
      @toaster.pop 'success','','Request successful, Please check your email'
    .finally =>
      @uploading_excel = false
      @files = []
      @uploadType = {}

  selectType: (type) ->
    @tabType = type

  processExcelFile: (response) =>
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

  uploadDropAttachment: () =>
    @new_document_uploaded = true
    @files = @drop_files

    if @drop_files?.length
      @uploaded_file = @drop_files[0]

  inviteAllContacts: () ->
    @toaster.pop 'info','','Your request is being processed'
    @Restangular.all('contacts/bulk_invites').customGET()
    .then((response) =>
      @toaster.pop 'success','','High Five! All your contacts have been invited'
    )
    .finally(=>
    )
