class DVFileUploaderController extends BaseController
  @register 'DVFileUploaderController'

  @inject '$attrs', 'DueDiligenceDataservice', '$scope', '$q', '$timeout', '$parse', 'FileHandlerFactory'

  initialize: ->
    attrs = @$attrs

    @allowed_file_extensions = @getAllowedFileExtensions(@$attrs.allowedFileTypes)
    @label = @$attrs.label || 'Upload'
    @readonly = angular.isDefined(attrs.readonly)
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

    if attrs.response?
      @response = @$scope.$parent.$eval(attrs.response)

    attachments = @$scope.$parent.$eval(attrs.attachments)

    deregisterer = @$scope.$parent.$watch attrs.attachments, (value) =>
      if value?
        attachments = value
        @attachments = attachments
        deregisterer()

    unless attachments?
      attachments = []
      @$parse(attrs.attachments).assign(@$scope.$parent, attachments)

    @attachments = attachments

  getAllowedFileExtensions: (allowed_file_types='image,doc,excel,powerpoint,pdf,video,visio')->
    file_extension_map =
      doc: ['doc', 'docx']
      pdf: ['pdf']
      powerpoint: ['ppt', 'pptx', 'pptm', 'pps', 'ppsx']
      excel: ['csv', 'xls', 'xlsm', 'xlsx']
      image: ['png', 'jpg', 'jpeg', 'gif']
      video: ['mp4', 'mov', 'avi']
      visio: ['vsd', 'vsdx']

    allowed_file_extensions = _(allowed_file_types.split(',')).map (type) ->
      file_extension_map[type.trim()]

    allowed_file_extensions = _(allowed_file_extensions).flatten()

    _(allowed_file_extensions).map((file_extension) ->
      ".#{file_extension}"
    ).join(',')

  uploadAttachment: (files) ->
    return unless files.length

    @progress_percentage = 0
    @upload_in_progress = true

    if angular.isDefined(@$attrs.stubUpload)
      promise = @fakeUpload(files)
    else
      promise = @initiateUpload(files)

    promise.progress (evt) =>
      progress_percentage = parseInt(100.0 * evt.loaded / evt.total)

      @progress_percentage = progress_percentage

    promise.success (uploaded_files) =>
      if uploaded_files && uploaded_files.length
        uploaded_file = uploaded_files[0]

        @upload_in_progress = false
        @attachments.push(uploaded_file)

        @addAttachmentIdToResponse(uploaded_file.id)

        @triggerChange()
      else
        @toaster.pop 'error', '', 'Something went wrong with the file upload, please write to support', 5000

  initiateUpload: (files) ->
    @DueDiligenceDataservice.uploadAttachment(files)

  removeAttachment: (attachment) ->
    @attachments.splice(@attachments.indexOf(attachment), 1)

    @removeAttachmentIdFromResponse(attachment.id)

    @triggerChange()

  addAttachmentIdToResponse: (id) ->
    if @response?
      unless @response.attributes.attachmentIds?
        @response.attributes.attachmentIds = []

      @response.attributes.attachmentIds.push(id)

  removeAttachmentIdFromResponse: (id) ->
    if @response?
      attachmentIds = @response.attributes.attachmentIds
      attachmentIds.splice(attachmentIds.indexOf(id), 1)

      unless @response.attributes.attachmentIds.length
        @response.attributes.attachmentIds = null

  triggerChange: ->
    if @$attrs.onChange?
      @$scope.$parent.$eval @$attrs.onChange

  fakeUpload: (files) ->
    promise = {}
    success_cb = null
    progress_cb = null
    duration = 2000
    steps = 10
    delay = duration / steps

    promise.progress = (_cb) ->
      progress_cb = _cb

    promise.success = (_cb) ->
      success_cb = _cb

    while steps > 0
      do (steps) =>
        @$timeout(=>
          progress_cb({loaded: (10 + 1 - steps), total: 10})

          if steps is 1
            success_cb(files)
        , delay * (10 + 1 - steps))

      steps--

    promise
