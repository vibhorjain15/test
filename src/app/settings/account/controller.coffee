class AccountSettingsController extends BaseController
  @register 'AccountSettingsController'

  @inject 'Restangular', 'toaster', 'AuthService', 'Utils','angularEnabled'

  initialize: ->
    @params = {}
    @passwordElementType = 'password'
    @passwordElementType2 = 'password'
    @passwordElementType3 = 'password'

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

  showPasswordToggle3: =>
    @passwordNotVisible3 = !@passwordNotVisible3
    if @passwordElementType3 == 'password'
      @passwordElementType3 = 'text'
    else
      @passwordElementType3 = 'password'

  submit: ->
    if @change_password_form.$valid
      @saving = true

      @Restangular
        .one('Account', 'ChangePassword').customPUT(@params)
        .then =>
          @toaster.pop 'success', '', 'Your password has been changed!'
          @change_password_form.$setPristine()
          @change_password_form.$setUntouched()
          @AuthService.logout()
        .finally =>
          @saving = false
          @params = {}
          @change_password_form.$setPristine()
          @change_password_form.$setUntouched()

