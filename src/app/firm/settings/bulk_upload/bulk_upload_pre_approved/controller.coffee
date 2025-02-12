class BulkUploadPreApprovedController extends BaseController
  @register 'BulkUploadPreApprovedController'

  @inject  'Restangular', 'toaster', 'FileHandlerFactory', 'Utils', '$http', 'PopupCheckerService', 'baseUrl', 'DueDiligenceDataservice','angularEnabled', '$window'

  initialize: ->
    @allowed_file_extensions = ['.xls', '.xlsm', '.xlsx']
    @uploadType = {}
    @updatedParams = {}
    @user_id = @Utils.getCurrentFirm().id
    @current_firm_id = @Utils.getCurrentFirm().id
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
    if !@isManager
      @$window.history.back()
      return

  downloadEmptySampleFile: =>
    @toastInstance = @toaster.pop({type: 'info', title: 'Downloading File', body: 'Please wait...', timeout: 0})
    @$http({
        url: @baseUrl + '/bulk_import/qna_download',
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
        url: @baseUrl + '/bulk_import/qna_download',
        responseType: 'arraybuffer',
        method: "GET"
    }).then (response) =>
      @toaster.clear(@toastInstance)
      @processExcelFile(response)
    , (error)=>
      @toaster.clear(@toastInstance)

  addDocumentSubmit: () =>
    unless @files?.length
      @toaster.pop 'error', '', 'Please select at least one file'
      return
    # 'Team Members', 'Firm Upload', 'Contact Upload', 'Fund Upload'
    selectedTypes = []
    selectedTypes.push 'Qna'

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
        url: @baseUrl + '/bulk_import/qna_upload',
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
      popup = window.open httpPath, '_blank', ''
      PopupCheckerService.check(popup)
