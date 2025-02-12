class ConfirmPasswordResetController extends BaseController
  @register 'ConfirmPasswordResetController'

  @inject '$http', '$stateParams', 'toaster', '$state', 'authenticationUrls', '$rootScope', '$timeout','SecureStorageFactory'

  initialize: ->
    # @params =
    #   email_id: @$stateParams.email_id
    #   token: @$stateParams.token
    # @verifying_token = true
    # @passwordElementType = 'password'
    # @passwordElementType2 = 'password'


    # @$http.get(
    #   @authenticationUrls.verifyToken,
    #   params: @params,
    #   skip_auth_failure_redirection: true
    # )
    # .then ((response) =>
    #   @invalid_token = false
    #   @verifying_token = false
    # ), (error) =>
    #   @invalid_token = error.status is 401
    #   @verifying_token = false

  showPasswordToggle: =>
    @passwordNotVisible = !@passwordNotVisible
    if @passwordElementType == 'password'
      @passwordElementType = 'text'
    else
      @passwordElementType = 'password'

  showPasswordToggle2: =>
    @passwordNotVisible2 = !@passwordNotVisible2
    if @passwordElementType2 == 'password'
      @passwordElementType2 = 'text'
    else
      @passwordElementType2 = 'password'

  resetPassword: ->
    if @password_reset_form.$valid
      @loading = true

      params = angular.extend({}, @params, {password: @SecureStorageFactory.encrypt(@confirmPassword)})

      @$http.post(
        @authenticationUrls.resetPassword,
        params,
        skip_auth_failure_redirection: true
      )
      .then ((response) =>
        message = 'Your password has been reset successfully!'
        @toaster.pop 'success', '', message, 5000
        @$state.go 'authentication.login'
        @$timeout =>
          @NewPassword = ''
          @confirmPassword = ''
          @password_reset_form.$setPristine()
          @password_reset_form.$setUntouched()
        , 1000
        @loading = false
      ), (error) =>
        @invalid_token = error.status is 401
        @$timeout =>
          @NewPassword = ''
          @confirmPassword = ''
          @password_reset_form.$setPristine()
          @password_reset_form.$setUntouched()
        , 1000
        @loading = false
