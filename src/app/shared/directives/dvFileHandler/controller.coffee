class DvFileHandlerController extends BaseController
  @register 'DvFileHandlerController'

  @inject '$scope', '$attrs', 'SidebarPopViewService', 'toaster',
          '$parse', 'FileHandlerFactory'

  initialize: ->
    @parent_scope = @$scope.$parent
    @validFilenameRegex =@FileHandlerFactory.getFilenameRegex()
    @maxFilenameCharacters = @FileHandlerFactory.getFilenameCharacterLimit()
    @firstCharacterRegex = @FileHandlerFactory.getFirstCharacterRegex()

    if @$attrs.name
      @FileHandlerFactory.add(@$attrs.name, @)

      @$scope.$on '$destroy', =>
        @FileHandlerFactory.remove(@$attrs.name)

  triggerFileError: (files) =>
    errors = _(files).pluck('$error')
    errors = _(errors).uniq()

    angular.forEach errors, (error) =>
      if error is 'maxFiles'
        @toaster.pop 'error', 'Too many files', "Only #{@$attrs.ngfMaxFiles} can be uploaded at once"
      else if error is 'maxSize'
        @toaster.pop 'error', 'Too big file(s)', "Only #{@$scope.dvMaxFileSize} can be uploaded at once"
      else if error is 'validateFn'
        @toaster.pop 'error', 'Invalid Files', "#{@message}"
      else
        @toaster.pop 'error', 'Invalid Files', "Only #{@$scope.dvPattern} files are allowed"

  onFileSelect: (files, file, newFiles, duplicateFiles, invalidFiles, event ) ->
    @files = files

    @triggerFileError invalidFiles

    on_drop = @$attrs.dvOnDrop

    if @$attrs.dvBindFilesTo
      @$parse(@$attrs.dvBindFilesTo).assign(@parent_scope, files)

    if on_drop
      @parent_scope.$eval(on_drop)

    unless angular.isDefined(@$attrs.dvManualUpload)
      @upload()

  fileValidator: (file) ->
    return unless file?

    @message = ''
    if !(@validFilenameRegex.test(file.name))
      @message = 'File name can\'t have special characters'
      return false

    if !(@firstCharacterRegex.test(file.name))
      @message = 'File name can\'t start with space or special characters (= + - @)'
      return false

    if !(file.name.length <= @maxFilenameCharacters)
      @message = 'Maximum file name limit reached'
      return false

    return true

  upload: () ->
    files = @files

    if @$attrs.dvFields
      fields = @parent_scope.$eval @$attrs.dvFields
    return unless files?.length

    upload_url = @$attrs.dvUploadUrl
    on_upload = @$attrs.dvOnUpload
    on_upload_error = @$attrs.dvOnUploadError
    is_aggregate_upload = angular.isDefined(@$attrs.dvAggregateUpload)

    sidebar_popup = @SidebarPopViewService.open({
      templateUrl: 'sidebar_popups/file_upload_progress/template.html'
      controller: 'SidebarPopupFileUploadProgressController'
      controllerAs: 'vm'
      title: 'Uploading'
      resolve:
        files: -> files
        uploadUrl: -> upload_url
        fields: -> fields
        isAggregateUpload: -> is_aggregate_upload
    })

    sidebar_popup.result
    .then (response) =>
      if on_upload
        if @$attrs.dvBindUploadedFilesTo
          attachments = @$scope.$parent.$eval(@$attrs.dvBindUploadedFilesTo)
          _(response).each (attachment) =>
            attachments.push(attachment[0])
          @$parse(@$attrs.dvBindUploadedFilesTo).assign(@parent_scope, attachments)
        @parent_scope.$eval(on_upload, {
          response: response
        })
    , (error) =>
      if on_upload_error
        @parent_scope.$eval(on_upload_error, {
          response: error
        })

