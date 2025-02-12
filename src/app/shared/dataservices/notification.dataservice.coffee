angular.module('diligenceVault').factory 'NotificationDataservice', (Restangular, $rootScope)->
  new class NotificationDataservice
    getNotifications: (params) ->
      Restangular.all('notifications').customGET('', params).then (response) =>
        angular.forEach response.results, (notification) ->
          notification.unread = !notification.viewTimeStamp

        response

    getUnreadNotificationCount: ->
      Restangular.one('notifications', 'unread_count').get()

    markAsRead: (id) ->
      Restangular.one('notifications', id).put().then (response) =>
        $rootScope.$emit 'read:notification', response

        response

    markAllAsRead: ->
      Restangular.all('notifications').all('read_all').post().then =>
        $rootScope.$emit 'read_all:notifications'
