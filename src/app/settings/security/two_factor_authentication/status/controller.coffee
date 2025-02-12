class TwoFactorAuthenticationStatusController extends BaseController
  @register 'TwoFactorAuthenticationStatusController'

  @inject 'Utils', 'SweetAlert', 'Restangular','toaster','angularEnabled'

  initialize: ->
    @currentUser = @Utils.getCurrentUser()

  disable2FA: ->

    @SweetAlert.confirm({
      title: 'Are you sure you want to disable two factor authentication ?'
      confirmButtonText: 'Yes'
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @Restangular.one('two_factor_authentication', 'disable').customPOST({}).then =>
          @toaster.pop 'success','', 'Two factor authentication is successfully disabled'
          @currentUser.twoFactorEnabled = false
          @twoFactorEnabled = false
        .finally => swal.close()
    })
