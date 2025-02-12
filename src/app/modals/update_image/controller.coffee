class ImageUpdateController extends ModalController
  @register 'ImageUpdateController'

  @inject 'toaster', '$scope', 'ImageDataService', '$uibModalInstance', '$timeout'

  initialize: ->
    @urlBlob = {}
    @resultImageDataURI = ''
    @resultBlob = {}
    @minAreaSize = 100
    @areaType = 'rectangle'
    @supportedImageExtensions = [ 'png', 'jpg', 'jpeg' ]

  fileChangeCallback: (event) =>
    file = event.currentTarget.files[0]
    fileReader = new FileReader

    fileReader.onload = (event) =>
      @$scope.$apply () =>
        imageURI = event.target.result
        @imageFormat = imageURI.substring(imageURI.indexOf('/') + 1, imageURI.indexOf(';'))

        if @imageFormat in @supportedImageExtensions
          @imageDataURI = event.target.result
        else
          @toaster.pop 'error', 'Invalid File', 'Selected file is not supported, please upload a png, jpg or jpeg file.'

    fileReader.readAsDataURL file

  isPreviewPresent: () =>
    !_.isEmpty @urlBlob


  initCropper: (id) =>
    img = document.getElementById(id)
    @$timeout =>
      @cropper = new Cropper(img, {
        preview: '.imgPreview'
        minCropBoxWidth: 100
        minCropBoxHeight: 100
        autoCropArea: 1
      })

  submit: () =>
    if @cropper
      @progressPercentage = 0
      @savingImage = true
      cropcanvas = @cropper.getCroppedCanvas()
      cropcanvas.toBlob ((blob) =>
        @resultBlob = blob
        @resultBlob.name = 'Img-' + new Date().getTime() + '.png'
        @ImageDataService.uploadImage(@resultBlob).progress((evt) =>
          progressPercentage = parseInt(100.0 * evt.loaded / evt.total)
          @progressPercentage = progressPercentage
        ).success (uploaded_file) =>
          @savingImage = false
          @$uibModalInstance.close uploaded_file[0]

        # this line should be here
        return
      ), 'image/png'
