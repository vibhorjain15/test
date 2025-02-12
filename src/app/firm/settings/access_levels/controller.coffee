class FirmSettingsTeamsController extends BaseController
  @register 'FirmSettingsAccessLevelsController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', 'TeamsManager', 'ModalFactory', '$state','angularEnabled'

  initialize: ->
  