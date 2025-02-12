class TwoFactorAuthenticationIntroController extends BaseController

  @register 'TwoFactorAuthenticationIntroController','angularEnabled'

  @inject '$state', 'Utils'

  initialize: ->
    @setup_app_on_mobile = false

  redirectTo2FASetup: ->
    @$state.go 'app.settings.security.two_factor_authentication.setup'
