angular.module('diligenceVault').directive 'diligenceStatus', ($filter, $compile) ->
  restrict: 'A'
  link: ($scope, element, attributes) ->
    label_class = undefined

    setLabelClass = (status) ->
      if label_class
        element.removeClass label_class

      switch status
        when 'Completed', 'Approved', 'APPROVED', 'Unanswered', 'ExtensionApproved', 'Registered'
          type = 'success'
        when 'NotApproved', 'Deleted', 'Answered', 'Withdrawn', 'ExtensionDeclined', 'Retired'
          type = 'danger'
        when 'Started', 'Following', 'Scheduled', 'ACTIVE'
          type = 'default'
        when 'Followup', 'Invested', 'Invited', 'PendingRestart', 'APPROVED-120','WIP', 'Extension Requested', 'ExtensionRequested', 'ERA'
          type = 'warning'
        when 'Reminded', 'Restarted', 'RestartApproved','InReview','Evaluation'
          type = 'info'
        when 'Sent'
          type = 'orange'

      label_class = "label-#{type}"

      element.addClass "label text-uppercase #{label_class}"
      element.html "<small>#{$filter('sentencize')(status)}</small>"

    $scope.$watch attributes.diligenceStatus, (value) ->
      setLabelClass value if value
