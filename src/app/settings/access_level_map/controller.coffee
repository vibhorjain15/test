class UserRolesMapController extends BaseController
  @register 'UserRolesMapController'

  @inject 'Restangular', 'Utils', '$q', '$timeout','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @isInvestor = @Utils.isInvestor()
    @hasFirmWideRole = @Utils.hasFirmWideRole()
    @currentFirmId = @current_user.firmInfo.id
