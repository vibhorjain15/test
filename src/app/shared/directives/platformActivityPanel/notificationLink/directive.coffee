angular.module('diligenceVault').directive 'notificationLink', (NotificationDataservice, $state) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    notification = scope.$eval attrs.notification
    notification_type = notification.type

    markAsRead = ->
      return unless notification.unread

      NotificationDataservice.markAsRead(notification.id)

    switch notification_type
      when 'invitation'
        href = $state.href('app.diligence.projects.activity', {
          type: "in-progress"
        })

      when 'duediligence'
        href = $state.href('app.diligence.project.questionnaire', {
          diligenceId: notification.targetID
        })
 
      when 'followup'
        href = $state.href('app.diligence.project.questionnaire', {
          diligenceId: notification.targetID, status: "Followup"
        })

      when 'diligencefollowup'
        href = $state.href('app.diligence.project.summary', {
          diligenceId: notification.targetID
        })

      when 'workflow'
        href = $state.href('app.workflow_automation.detail', {
          Id: notification.targetID
        })  

      when 'documentShared'
        href = $state.href('app.content.document.detail', {
          documentId: notification.targetID
        })
        
      when 'documentVersionChanged'
        href = $state.href('app.content.document.detail', {
          documentId: notification.targetID
        })
    
  


    element.attr('href', href)

    if notification.unread
      element.on('click', markAsRead)
      element.on('click', '.js-mark-explicit', (e) ->
        markAsRead()

        e.preventDefault()
        e.stopPropagation()
      )
