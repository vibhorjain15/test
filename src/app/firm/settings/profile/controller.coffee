class FirmSettingsProfileController extends BaseController
  @register 'FirmSettingsProfileController'

  @inject '$scope', 'toaster', 'Restangular', 'Utils','angularEnabled'

  initialize: ->
    firmId = @Utils.getCurrentFirm().id
    @$scope.getFirmProfile().then (firm_profile) =>
      @firm_profile = firm_profile
      @firm_profile_copy = angular.copy(firm_profile)

    @Restangular.all('team_members/admin').getList().then (response) =>
      _(response).each (user) -> user.fullname = _.compact([user.firstName, user.lastName]).join(' ')
      @users = response

    @Restangular.all('currency').getList().then (response) =>
      @currencies = response

    @Restangular.all('firm_types').getList().then (response) =>
      @firm_types = response

  submit: ->
    if @profile_form.$valid
      unless @firm_profile_copy.contactPerson?.id?
        @firm_profile_copy.contactPerson = null
      if @firm_profile_copy.aum == ""
        @firm_profile_copy.aum = 0
      @saving = true

      @$scope
        .saveFirmProfile(@firm_profile_copy)
        .then => @toaster.pop 'success', '', 'Your changes have been saved'
        .finally(=> @saving = false)

  updateContactPersonDetails: ->
    id = @firm_profile_copy.contactPerson.id

    _(@firm_profile_copy.contactPerson).extend _(@users).findWhere({id: id})
