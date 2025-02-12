class ApplicationController extends BaseController
  @register 'ApplicationController'

  @inject 'DvAlert', 'Utils', 'NotificationsFactory'

  initialize: ->
    expiry_date = @Utils.getCurrentUser().firmInfo.expiryDate
    freeSubscription = @Utils.isFreeSubscription()


    if !freeSubscription && expiry_date?
      days_remaning = moment(expiry_date).diff(moment(), 'days')

      if days_remaning <= 5
        switch days_remaning
          when 0
            message = 'Your trial/subscription is going to expire today'
          when 1
            message = 'Your trial/subscription will expire tomorrow'
          else
            message = "Your trial/subscription will expire in #{days_remaning} days"

        @DvAlert.notify({
          message: message,
          type: 'warning',
          button_label: 'Dismiss'
        }, =>
          @DvAlert.dismissActiveNotification()
        )
