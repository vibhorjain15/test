class UploadAumTrController extends ModalController
  @register 'UploadAumTrController'

  @inject '$http', 'baseUrl', 'entity_id', 'entity_type', 'PopupCheckerService', 'toaster'

  initialize: ->
    @is_downloading = false
    @is_uploading = false
    @periods = [
      {
        id: null,
        name: 'Both Monthly and Quarterly',
      },
      {
        id: 0,
        name: 'Monthly',
      },
      {
        id: 2,
        name: 'Quarterly',
      },
    ]
    @selected_period = @periods[1]

  submit: ->
    if @files and @files.length > 0
      @upload()
  
  downloadSampleFile: ->
    @is_downloading = true
    @$http.post(@baseUrl + '/service/excel_services/aum_tr_download', {
      period: @selected_period.id,
      download_blank: true,
      for_entity_id: @entity_id
      for_entity_type: @entity_type
    }, {responseType: "arraybuffer"}).then ((response) =>
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
      @is_downloading = false
    ), (error) =>
      @is_downloading = false
      @toaster.pop 'error','','Something went wrong while downloading the sample file. Please try again.'

  upload: ->
    @is_uploading = true
    formData = new FormData()
    formData.append('file', @files[0])
    if @selected_period and @selected_period.id != null
      formData.append('selected_periods', @selected_period.id.toString())
    formData.append('for_entity_id', @entity_id)
    formData.append('for_entity_type', @entity_type)
    @$http.post(@baseUrl + '/service/excel_services/aum_tr_upload/upload', formData,{
      transformRequest: angular.identity,
      headers: { 'Content-Type': undefined }
    })
    .then ((response) =>
      @is_uploading = false
      @toaster.pop 'success','Processing File','You will receive an email once the uploaded AUM/TR records are processed'
      @$uibModalInstance.close(response)
    ), (error) =>
      if error and error.status == 422
        @upload_error_message = error.data?.message || 'Invalid file format. Please make sure to only use our sample excel file while uploading AUM/TR data.'
      else
        @toaster.pop 'error','','Something went wrong while uploading the AUM/TR records. Please try again.'

      @is_uploading = false

  selectFile: ->
    @upload_error_message = ''
      