class ReportsTemplatesDetailPreviewController extends BaseController
  @register 'RealtimeReportsDetailPreviewController'
  @inject 'ReportTemplateDataservice', '$stateParams', 'FundDataservice', 'Restangular', '$timeout', 'toaster', 'Utils','$http','baseUrl'

  initialize: =>
    @reportApiPingCount = 0
    @maxApiRetry = 60
    # Max Time allocated for html2pdf service:
    # maxApiRetry x timeout (in ms) = 60 x 3,000 = 1,80,000 ms = 3 minutes
    @getReport(@$stateParams.reportId).then (response) =>
      @report = response
      @options =
        entity_id: response.entity_id
        entity_type: response.entity_type
        entity_name: response.name
        parent_entity_id: response.firm_id

  getReport: (id) =>
    @ReportTemplateDataservice.getReport(id)

  generatePDF: () =>
    markup = document.documentElement.innerHTML
    if window.location.host == 'localhost:8000'
      ###When testing on local, the below CSS url has to be updated with the one present on dev / test instance###
      markup = markup.replace('href="static/stylesheets/app.css', 'href="http://dv-test-ui.azurewebsites.net/static/stylesheets/app.min.cdbc1fee2513038d.css')
    else
      markup = markup.replace('href="static/stylesheets/app', 'href="'+window.location.protocol + "//" + window.location.host + '/static/stylesheets/app')

    head = markup.match(/<head[^>]*>[\s\S]*<\/head>/gi)
    ###head = '<head>' + '<link rel="stylesheet" href="https://dv-test-ui.azurewebsites.net/static/stylesheets/app.min.6727bbc3f6840f56.css">'+ '</head>'###
    body = markup.match(/<body[^>]*>[\s\S]*<\/body>/gi)

    reportInnerSection = $('#report-preview-section', markup)
    report_html = '<body class="export-as-pdf"><div class="container-fluid">' + reportInnerSection[0].innerHTML + '</div></body>'

    final_html = '<!DOCTYPE html>'+
                  '<html>'+
                    head + report_html +
                  '</html>'

    params=
      "job_params" : final_html

    @toastInstance = @toaster.pop({type: 'info', title: 'Generating Report...', body: 'Please wait while the report is being generated.', timeout: 0})

    @$http.post("#{@baseUrl}/reports/#{@$stateParams.reportId}/generate_pdf", params, {
      responseType:'arraybuffer'
    })
    .then (response) =>
      @currentJobInProgress = response.id

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
    , (error) =>
      @toaster.clear(@toastInstance)
      @toaster.pop 'error', '', error.message
    ###x = window.open()
    x.document.open()
    x.document.write(final_html)
    x.document.close()###
