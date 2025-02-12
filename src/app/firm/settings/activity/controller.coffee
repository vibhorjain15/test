class FirmSettingsActivityController extends BaseController
  @register 'FirmSettingsActivityController'

  @inject '$scope', 'Restangular','ModalFactory','Utils','angularEnabled'

  initialize: ->
    @is_manager = @Utils.isManager()
    @upgradeNeeded = 0
    @entity_count = 0
    @FTupgradeNeeded = 0
    @LTupgradeNeeded = 0
    @is_freeSubscription = @Utils.isFreeSubscription()
    @Restangular.all('platform_activity').customGET().then (response) =>
      @activity = response

      @entity_count = @activity.fulltouch_count + @activity.lighttouch_count

      if (@activity.ft_limit && ((@entity_count * 100 ) / @activity.ft_limit) > 80)
        @FTupgradeNeeded = 1

      if (@activity.ft_limit && ((@activity.fulltouch_count * 100 ) / @activity.ft_limit) > 80)
        @FTupgradeNeeded = 1

      if (@activity.lt_limit && ((@activity.lighttouch_count * 100 ) / activity.lt_limit) > 80)
        @LTupgradeNeeded = 1

      if (@activity.request_limit && ((@activity.projects_count * 100 ) / activity.request_limit) > 80)
        @upgradeNeeded = 1
