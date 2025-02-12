class UploadUserAvatarController extends ModalController

  @register 'UploadUserAvatarController'

  @inject 'Upload', 'toaster', 'baseUrl', 'user', 'Restangular', 'Utils', '$uibModalInstance', 'FileHandlerFactory'

  initialize: ->
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    allowed_file_extensions = ['jpg', 'png', 'jpeg']
    @currentUser = @Utils.getCurrentUser()

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

  uploadAvatar: (files) ->
    file = files[0]
    @file_uploaded = false
    @file = file

    if file
      file.upload = @Upload.upload(
        url: @baseUrl + '/users/avatar'
        file: [file]
      )

      file.upload.then ((response) =>
        url = response.data[0].blobUrl
        user_model = angular.copy(@user)
        user_model.picture_url = url

        @saveUserProfile(user_model).then(=> @file_uploaded = true)
      ), =>
        @toaster.pop 'error', '', 'Something went wrong with the file upload, please write to support', 5000

      file.upload.progress (evt) ->
        file.progress = Math.min(100, parseInt(100 * evt.loaded / evt.total))

  removeAvatar: ->
    user_model = angular.copy(@user)
    user_model.basicUserInfo.avatarURL = null
    @removing_avatar = true

    @saveUserProfile(user_model).then(=> @removing_avatar = false)

  saveUserProfile: (user_model) ->
    @Restangular.one('users', @currentUser.id).customPUT(user_model).then (response) =>
      _(@user).extend response

      @currentUser.avatarURL = response.picture_url

      @displaySuccessMessage()

      @$uibModalInstance.close response

  displaySuccessMessage: ->
    @toaster.pop 'success', '', 'Avatar updated successfully', 5000

  cancel: (-> @$uibModalInstance.dismiss 'cancel')
