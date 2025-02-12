class BeginPasswordResetController extends BaseController
  @register 'BeginPasswordResetController'

  @inject '$http', '$stateParams', 'toaster', '$state', '$scope', 'authenticationUrls', '$q'

  initialize: ->
    # @userName = @$stateParams.userName
    # @siteKey = "6Le18uIeAAAAAFETJrSsdtSI0RUL-5Ay7TgOJvS7";

    # deregisterer = @$scope.$watch('vm.password_reset_form', ((value) =>
    #   if value?
    #     @password_reset_form.userName.$dirty = true
    #     deregisterer()
    # ), true)

  checkEmailExistence: (username)=>
    deferred = @$q.defer()
    @$http.get(@authenticationUrls.verifyUsername,
      params: EmailID: username
      skip_404_redirection: true)
    .then ((response) =>
      deferred.resolve()
    ), (error) =>
      if error.status is 404
        deferred.reject()
      else if error.status is 400
        deferred.reject(error)
      @loading = false
    deferred.promise

  submit: (email)=>
    if @password_reset_form.$valid and @myRecaptchaResponse
      @loading = true
      @hideMessage()
      @checkEmailExistence(email).then (response)=>
        @resetPassword(email,@myRecaptchaResponse)
      ,(error)=>
        if error
          message = "Your account needs activation. We have resent activation link to #{email}. Please activate your account and login."
          if error.data and error.data.error_description
            message = error.data.error_description
          @showMessage('alert alert-custom-danger', message)
        else
          @showMessage('alert alert-custom-danger', "Username doesn't exist in our database. If you have received a forward from a colleague, please email ask@diligencevault.com to create your account")

  resetPassword: (email, captchaResponse) ->
    params =
      EmailID: email
      recaptchaToken: captchaResponse
    @$http.post("#{@authenticationUrls.forgotPassword}", params)
    .then ((response) =>
      @loading = false
      message = "We have sent the password reset link to #{email}. Please click on that link to reset your password."
      @toaster.pop 'success', 'Password reset email sent', message, 5000
      @$state.go 'authentication.login'
    ), (error) =>
      @loading = false
      if error.data and error.data.error_description
        message = error.data.error_description
        @showMessage('alert alert-custom-danger', message)

  showMessage: (type,message )=>
    @alertMessage = message.split('. ')
    @messageShown = true
    @type = type

  hideMessage: =>
    @messageShown = false
