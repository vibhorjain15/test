class MyProfileController extends BaseController

  @register 'MyProfileController'

  @inject 'toaster', '$http', 'baseUrl', 'currentUser', '$filter', 'Restangular', 'Utils', 'SweetAlert', 'ModalFactory'

  initialize: ->
    @editHide = false
    @saveHide = true
    @labelHide = false
    @fieldHide = true
    @twoFactorEnabled = @Utils.getCurrentUser().twoFactorEnabled
    @account_info = angular.copy(@currentUser)

    @Restangular.one('users', 'me').get().then (response) =>
      @user = response

    @Restangular.all('country').getList().then (response) =>
      @countries = response

    @Restangular.one('User', 'Profile').all('NotificationSettings').customGET().then (response) =>
      @email = response.settings

    @Restangular.all('sessions').getList().then (response) =>
      @sessions = response

    @switchMode('readonly')

  switchMode: (mode) ->
    if mode is 'edit'
      @userModel = angular.copy(@user)
      @templateName = 'myprofile/my-profile-edit.html'
    else if mode is 'readonly'
      @templateName = 'myprofile/my-profile-readonly.html'

  save: ->
    @saving = true

    if @userModel.birthDate
      @userModel.birthDate = @$filter('date')(@userModel.birthDate, 'MM-dd-yyyy')

    @Restangular.one('users', @currentUser.id).customPUT(@userModel).then (response) =>
      message = 'Your profile changes have been saved!'

      angular.extend @user, response
      angular.extend @currentUser,
        firstName: @user.basicUserInfo.firstName
        lastName: @user.basicUserInfo.lastName

      @toaster.pop 'success', '', message
      @saving = false

      @switchMode('readonly')

  passEdit: ->
    if @change_password_form.$valid
      @saving_password = true

      @Restangular.one('Account', 'ChangePassword').customPUT(@account_info).then =>
        message = 'Your password has been changed!'

        @toaster.pop 'success', '', message, 5000
        @saving_password = false

  processEmail: ->
    @emailLoading = true
    data = _(@email).map((item) -> _(item).pick 'key', 'value')
    @$http(
      url: @baseUrl + '/User/Profile/NotificationSettings'
      method: 'PUT'
      data: data
      headers: 'Content-Type': 'application/json'
    ).then () =>
      message = 'Your settings have been changed!'

      @toaster.pop 'success', '', message, 5000
      @emailLoading = false

  disable2FA: ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to disable two factor authentication ?'
      confirmButtonText: 'Yes'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @Restangular.one('two_factor_authentication', 'disable').customPOST({}).then =>
          @SweetAlert.success({
            title: 'Two factor authentication is successfully disabled'
          })
          @currentUser.twoFactorEnabled = false
          @twoFactorEnabled = false
        .finally => swal.close()
    })

  edit: ->
    @editHide = true
    @labelHide = true
    @fieldHide = false
    @saveHide = false

  displayUserAvatarDialog: ->
    @ModalFactory.invokeModal 'upload_user_avatar',
      resolve:
        user: (=> @user)
