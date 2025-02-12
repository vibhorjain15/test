angular.module('diligenceVault').factory 'userservice', ($http, authenticationUrls) ->

  new class UserService
    userId = null

    saveUserId: (user_id) =>
      userId = user_id

    getSavedUserId: =>
      userId

    resetSavedUser: =>
      userId = null

    getCurrentUser: ->
      $http.get(authenticationUrls.currentUser, {headers: {'page-url': 'account'}})
