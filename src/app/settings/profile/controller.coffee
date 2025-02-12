class ProfileSettingsController extends BaseController
  @register 'ProfileSettingsController'

  @inject 'Restangular', 'toaster', '$q', '$filter', 'Utils', 'ModalFactory','angularEnabled'

  initialize: ->
    @setMode('readonly')
    @loadData()

  loadData: ->
    promises = []

    promises.push @Restangular.one('users', 'my-profile').get().then (response) =>
      @user = response

    promises.push @Restangular.all('country').getList().then (response) =>
      @countries = response

    @loading = true
    @$q.all(promises).then => @loading = false


  getCountryById: (id) ->
    country = _(@countries).findWhere({id: id})
    if country
      country.value

  setMode: (mode) =>
    @mode = mode

    if mode is 'edit'
      @userModel = angular.copy(@user)
      @templateName = 'settings/profile/edit.html'
    else if mode is 'readonly'
      @templateName = 'settings/profile/readonly.html'

  toggleMode: ->
    if @mode is 'edit' then @setMode('readonly') else @setMode('edit')

  submit: ->
    if @user_profile_form.$valid
      currentUser = @Utils.getCurrentUser()

      @saving = true
      @Restangular.one('users', currentUser.id).customPUT(@userModel).then (response) =>
        message = 'Your profile changes have been saved!'

        angular.extend @user, response
        angular.extend currentUser,
          firstName: @user.firstname
          lastName: @user.lastname

        @toaster.pop 'success', '', message
        @saving = false

        @toggleMode()

  displayUserAvatarDialog: ->
    @ModalFactory.invokeModal 'upload_user_avatar',
      resolve:
        user: (=> @user)
