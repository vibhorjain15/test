class QuestionnaireUploadImageController extends ModalController
  @register 'QuestionnaireUploadImageController'

  @inject 'ImageDataService', 'editor', 'Restangular', 'FileHandlerFactory', 'SweetAlert', 'BaseDataService', 'toaster'

  initialize: ->
    allowed_file_extensions = ['gif', 'jpg', 'png', 'jpeg']
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    @search_text = ""
    @activeSort = ""

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    @images = []
    @current_page = 0
    @reverseValueForSortByAlphabet = false
    @reverseValueForSortByDate = false
    @reverseValueForSortByMostUsed = false
    @loadImages()



  sort_by_key: (field, reverse, primer) ->
    key = if primer then ((x) ->
      primer x[field]
    ) else ((x) ->
      x[field]
    )
    reverse = if !reverse then 1 else -1
    (a, b) ->
      a = key(a)
      b = key(b)
      reverse * ((a > b) - (b > a))

  sortBy: (type) ->
    @activeSort = type
    if type == 'alphabetical'
      @reverseValueForSortByAlphabet = !@reverseValueForSortByAlphabet
      @images.sort @sort_by_key('fileName', @reverseValueForSortByAlphabet, (a) ->
        a.toUpperCase()
      )
    if type == 'mostRecent'
      @reverseValueForSortByDate = !@reverseValueForSortByDate
      @images.sort @sort_by_key('insertTimeStamp', @reverseValueForSortByDate, (a) ->
        moment(a).format('YYYYMMDD')
      )
    if type == 'mostUsed'
      @reverseValueForSortByMostUsed = !@reverseValueForSortByMostUsed
      @images.sort @sort_by_key('usage_count', @reverseValueForSortByMostUsed, parseInt)


  resetFilter: ->
    @search_text = ""

  loadImages: (params) ->
    @loading_images = true
    @ImageDataService.getImages().then (response) =>
      angular.forEach(response, (image,idx) =>
        @images.unshift(image)
      )

      @loading_images = false

  searchImages: =>
    if @search_text.length
      params = {text: @search_text}
      @loadImages(params)

  sortImages: =>
    if @sort_by.length
      params = {sort_by: @sort_by}
      @loadImages(params)

  uploadAttachment: (files) ->
    return unless files.length

    @progressPercentage = 0
    @upload_in_progress = true

    @ImageDataService.uploadImage(files).progress((evt) =>
      progressPercentage = parseInt(100.0 * evt.loaded / evt.total)

      @progressPercentage = progressPercentage
    ).success (uploaded_files) =>
      if uploaded_files
        @upload_in_progress = false
        @images.unshift(uploaded_files[0])
      else
        @toaster.pop 'error', '', 'Something went wrong with the file upload, please write to support', 5000

  insert: (image) ->
    tpl = "<img src='%s' />"

    @editor.insertContent(tpl.replace('%s', image.blobUrl))
    @editor.focus()

    @close()

  confirmImageDelete: (image) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this image?"
      confirmButtonText: 'Yes'
      cancelButtonText: 'Cancel'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @deleteImage(image)
    })

  deleteImage: (image) ->
    @ImageDataService.deleteImage(image.id).then((response) =>
      @toaster.pop 'success', '', 'Image deleted successfully.'

      idx = -1
      _(@images).forEach (imageElement, index) ->
        if image.id == imageElement.id
          idx = index

      if idx > -1
        @images.splice idx, 1
    , (error) =>
      ignoredErrorStatuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in ignoredErrorStatuses)
        Utils.logError('Image Delete Error', error)
        @toaster.pop 'error', '', 'Unable to delete this image.'
    )
    .finally(-> swal.close())
