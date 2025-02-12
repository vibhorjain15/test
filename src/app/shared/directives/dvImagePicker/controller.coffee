class DVImagePickerController extends BaseController
  @register 'DVImagePickerController'
  @inject 'ImageDataService', '$scope', 'FileHandlerFactory', 'SweetAlert', 'toaster', 'BaseDataService'

  initialize: ->
    @images = []
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

    @getImages()

  onImageUpload: (response) ->
    image = response[0][0]

    @addImageToTop(image)

    @select(image)

  getImages: ->
    if @total_pages? and @current_page? and (@current_page is @total_pages)
      return

    if @current_page?
      pageNumber = @current_page + 1
    else
      pageNumber = 1

    params =
      pageNumber: pageNumber

    @loading_images = true

    @ImageDataService.getImages(params).then (response) =>
      @total_pages = response.meta.totalPages
      @data_length = response.meta.totalRecords
      @current_page = response.meta.pageNumber

      angular.forEach(response.results, (image) =>
        @images.push(image)
      )

      @loading_images = false

  setSelectionByUrl: (url) ->
    image = _(@images).findWhere()

  select: (image) ->
    if image? and image != undefined
      @selected_image = image

      @$scope.$setSelection(image?.id)

  addImageToTop: (image) ->
    @images.unshift(image)

  getImageById: (id) ->
    _(@images).findWhere(id: Number(id))

  toggleSelection: (image) ->
    if image is @selected_image
      @select(null)
    else
      @select(image)

  confirmImageDelete: (image) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this image?"
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
