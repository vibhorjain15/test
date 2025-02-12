class TwoFactorAuthenticationSetupController extends BaseController

  @register 'TwoFactorAuthenticationSetupController'

  @inject 'Utils', '$interpolate', 'SweetAlert', 'Restangular', '$state', 'toaster','angularEnabled'

  initialize: ->
    url = 'https://chart.googleapis.com/chart?chs=260x260&chld=M|0&cht=qr&chl=otpauth://totp/{{email}}?secret={{psk}}&&issuer=DiligenceVault'

    @currentUser = @Utils.getCurrentUser()
    @setup_params = {}
    @qr_code_url = @$interpolate(url)(
      email: @currentUser.userName
      psk: @currentUser.psk
    )

  displayPskCodeDialog: ->
    @SweetAlert.info
      title: 'Your two-factor secret'
      text: @currentUser.psk

  validateCode: ->
    if @tfa_form.$valid
      @validating = true

      @Restangular.all('two_factor_authentication').all('configure').post(@setup_params)
        .then (() =>
          @currentUser.twoFactorEnabled = true
          @toaster.pop 'success', '', 'Two factor authentication is successfully enabled'
          @$state.go 'app.settings.security.two_factor_authentication.status'
        ), () =>
          @toaster.pop 'error', '', 'Enter a valid 6-digit code.'
        .finally =>
          @validating = false
