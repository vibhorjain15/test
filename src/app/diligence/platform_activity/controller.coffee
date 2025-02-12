class PlatformActivityController extends BaseController
  @register 'PlatformActivityController'

  @inject 'NotificationDataservice'

  initialize: ->
    @getNotifications()

  getNotifications: ->
    @NotificationDataservice.getNotifications().then (response) =>
      @notifications = response
