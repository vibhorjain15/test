class SidebarPopupFileUploadProgressController extends BaseController
  @register 'SidebarPopupFileUploadProgressController'

  @inject '$dvSidebarPopupInstance', 'files', 'Upload',
          'uploadUrl', 'baseUrl', '$timeout', 'fields', '$q', 'isAggregateUpload', 'DocumentDataservice'

  initialize: ->
    @upload_files = []
    @results = []

    promises = []
    fields = @fields

    if @isAggregateUpload
      promises.push @uploadMultipleFiles(@files, fields)
      @$q.all(promises).then =>
        @$timeout =>
          @close(@results)
        , 1000
    else
      angular.forEach @files, (file) =>
        promises.push @uploadFile(file, fields)
      @$q.all(promises).then =>
        @$timeout =>
          @close(@results)
        , 1000

  uploadFile: (file, fields) ->
    upload_file =
      name: file.name

    promise = @uploadFiles([file], fields)

    @upload_files.push(upload_file)

    upload_file.uploading = true

    promise.progress (evt) =>
      progress_percentage = parseInt(100.0 * evt.loaded / evt.total)
      upload_file.progress_percentage = progress_percentage || 0
      @setPopupTitle()

    promise.then (result) =>
      upload_file.uploading = false
      @results.push(result.data)
    , (reason) =>
      @dismiss(reason)

    promise

  uploadMultipleFiles: (files, fields) =>
    angular.forEach files, (file) =>
      upload_file =
        name: file.name
        uploading: true
      @upload_files.push(upload_file)

    promise = @uploadMultipleFilesToServer(files, fields)

    promise.progress (evt) =>
      progress_percentage = parseInt(100.0 * evt.loaded / evt.total)
      angular.forEach @upload_files, (file) =>
        file.progress_percentage = progress_percentage || 0
      @setPopupTitle()

    promise.then (result) =>
      angular.forEach @upload_files, (file) =>
        file.uploading = false
      @results.push(result.data)
    , (reason) =>
      @dismiss(reason)

    promise

  setPopupTitle: ->
    progress_percentage = 0

    angular.forEach @upload_files, (upload_file) ->
      progress_percentage += upload_file.progress_percentage

    progress_percentage = progress_percentage/@upload_files.length

    @$dvSidebarPopupInstance.setTitle "Uploading #{progress_percentage}%"

  uploadFiles: (files, fields) ->
    pageUrl = @DocumentDataservice.getDocumentPageUrl()
    params =
      url: @baseUrl + @uploadUrl
      method: 'POST',
      file: files
      headers: {
        'page-url': pageUrl
      }
    if fields?
      params.fields = fields
    @Upload.upload(params)

  uploadMultipleFilesToServer: (files, fields) ->
    params =
      url: @baseUrl + @uploadUrl
      file: files

    if fields?
      params.fields = fields

    @Upload.upload(params)

  close: (result) ->
    @$dvSidebarPopupInstance.close(result)

  dismiss: (reason) ->
    @$dvSidebarPopupInstance.dismiss(reason)
