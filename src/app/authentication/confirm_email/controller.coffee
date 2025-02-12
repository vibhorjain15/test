class ConfirmEmailController extends BaseController
  @register 'ConfirmEmailController'

  @inject '$stateParams', '$state', 'toaster', '$http', 'authenticationUrls'

  initialize: ->
    @loading = true

    params = {
      token: @$stateParams.token,
      EmailId: @$stateParams.emailId
    }
    url = @authenticationUrls.confirmEmail

    @$http.post(url, params, skip_auth_failure_redirection: true)
    .then ((response) =>
      @loading = false
      @toaster.pop 'success', 'Your email has been confirmed successfully'
      if @$stateParams.redirectId
        @$state.go 'authentication.login', {redirectId: @$stateParams.redirectId}
      else
        @$state.go 'authentication.login'
    ), (error) =>
      @loading = false
      @token_expired = error.status is 401
