angular.module('diligenceVault').directive 'discussionFollow', (Utils, Restangular) ->
  restrict: 'E'
  templateUrl: 'discuss/directives/discussionFollow/template.html'
  replace: true
  scope: true
  link: (scope, element, attrs) ->
    init = (discussion)->
      currentUser = Utils.getCurrentUser()
      action = null
      following_discussion = !!_(discussion.followers).findWhere({id: currentUser.id})
      scope.follower_count = discussion.followers.length

      scope.$watch (-> following_discussion), (value) ->
        if value then initUnfollowMode() else initFollowMode()

      scope.executeAction = ->
        scope.processing_discussion_follow = true

        action()
          .then(-> following_discussion = !following_discussion)
          .finally(-> scope.processing_discussion_follow = false)

      getParams = ->
        entityType: 'discussion'
        entityID: discussion.id

      follow = ->
        Restangular
          .all('entity_followers')
          .customPUT(getParams())
          .then(-> scope.follower_count++)

      unfollow = ->
        Restangular
          .all('entity_followers')
          .customDELETE(null, getParams(), {'Content-Type': 'application/json; charset=utf-8'})
          .then(-> scope.follower_count--)

      initFollowMode = ->
        scope.btn_label = 'Follow'
        action = follow
        element.addClass('btn-default').removeClass('btn-default-outline')

      initUnfollowMode = ->
        scope.btn_label = 'Unfollow'
        action = unfollow
        element.removeClass('btn-default').addClass('btn-default-outline')

    deregisterer = scope.$watch attrs.discussion, (value) ->
      if value
        init(value)
        deregisterer()
