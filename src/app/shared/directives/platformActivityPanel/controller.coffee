class PlatformActivityPanelController extends BaseController
  @register 'PlatformActivityPanelController'

  @inject 'NotificationDataservice', '$attrs', '$parse', '$scope',
          '$rootScope'

  initialize: ->
    unregisterers = []
    @current_page = 1
    @preview = angular.fromJson @$attrs.preview
    @notifications = []

    if @$attrs.name?
      @$parse(@$attrs.name).assign(@$scope.$parent, @)

    @getNotifications()

    unregisterers.push @watchForReadNotificationEvent()
    unregisterers.push @watchForReadAllNotificationsEvent()

    @$scope.$on '$destroy', ->
      angular.forEach unregisterers, (unregister) ->
        unregister()

  watchForReadNotificationEvent: ->
    @$rootScope.$on 'read:notification', ($event, response) =>
      notification = _(@notifications).findWhere(id: response.id)

      notification.unread = false

  watchForReadAllNotificationsEvent: ->
    @$rootScope.$on 'read_all:notifications', =>
      _(@notifications).each (notification) ->
        if notification.unread
          notification.unread = false

  markAllAsRead: ->
    @loading = true

    @NotificationDataservice.markAllAsRead().finally(=>
      @loading = false
    )

  getNotifications: ->
    params =
      pageNumber: @current_page

    @is_loading = true

    @NotificationDataservice.getNotifications(params).then (response) =>
      @current_page = response.meta.pageNumber
      @total_pages = response.meta.totalPages
      @total_items = response.meta.totalRecords

      @notifications = response.results

      @is_loading = false

  closeMenu: ->
    $('.navbar-collapse').collapse('hide')

  refreshNotifications: ->
    @notifications = []
    @current_page = null

    @getNotifications()
