class EmailNotificationSettingsController extends BaseController
  @register 'EmailNotificationSettingsController'

  @inject 'Restangular', 'toaster', 'Utils','angularEnabled'

  initialize: ->
    @Restangular
      .all('user_notification_settings')
      .customGET()
      .then (response) => @notification_settings = response

  submit: ->
    @saving = true
    notificationKeys = _(@notification_settings).keys

    params = _(@notification_settings).pick notificationKeys
    @Restangular
      .all('user_notification_settings')
      .customPUT(params)
      .then =>
        @toaster.pop 'success', '', 'Your settings have been updated!'
      .finally => @saving = false
