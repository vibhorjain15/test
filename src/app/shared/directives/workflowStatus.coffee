angular.module('diligenceVault').directive 'workflowStatus', ($filter, $compile) ->
  restrict: 'A'
  link: ($scope, element, attributes) ->
    label_class = undefined

    setLabelClass = (status) ->
      if label_class
        element.removeClass label_class

      status = status.toLowerCase()

      switch status
        when 'completed'
          type = 'success'
        when 'pending'
          type = 'warning'
        when 'invisible'
          type = 'default'

      label_class = "label-#{type}"

      element.addClass "label text-uppercase #{label_class}"
      element.html "<small>#{ if status == 'completed' then 'Completed' else if status == 'pending' then 'Pending' else if status == 'invisible' then 'Pending' else '' }</small>"

    $scope.$watch attributes.workflowStatus, (value) ->
      setLabelClass value if value
