angular.module('diligenceVault').directive 'discussionReplyAgree', (Utils, Restangular) ->
  restrict: 'E'
  templateUrl: 'discuss/directives/discussionReplyAgree/template.html'
  replace: true
  scope: true
  link: (scope, element, attrs) ->
    init = (reply)->
      currentUser = Utils.getCurrentUser()
      action = null
      agreeing_with_reply = !!_(reply.agreeUsers).findWhere({id: currentUser.id})
      scope.agree_count = reply.agreeUsers.length

      scope.$watch (-> agreeing_with_reply), (value) ->
        if value then initUndoAgreeMode() else initAgreeMode()

      scope.executeAction = ->
        scope.loading = true

        action()
          .then(-> agreeing_with_reply = !agreeing_with_reply)
          .finally(-> scope.loading = false)

      agree = ->
        Restangular
          .one('discussion_replies', reply.id)
          .all('agree')
          .customPUT()
          .then(-> scope.agree_count++)

      undo_agree = ->
        Restangular
          .one('discussion_replies', reply.id)
          .customDELETE('agree')
          .then(-> scope.agree_count--)

      initAgreeMode = ->
        scope.btn_label = 'Agree'
        action = agree
        element.removeClass('btn-default-outline').addClass('btn-primary-outline')

      initUndoAgreeMode = ->
        scope.btn_label = 'Agreed'
        action = undo_agree
        element.removeClass('btn-primary-outline').addClass('btn-default-outline')

    deregisterer = scope.$watch attrs.reply, (value) ->
      if value
        init(value)
        deregisterer()
