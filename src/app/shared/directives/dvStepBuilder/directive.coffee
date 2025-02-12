angular.module('diligenceVault').directive 'dvStepBuilder', ->
  restrict: 'E'
  scope: true
  require: 'ngModel'
  template: '<textarea data-ng-model="stepnames" class="form-control" style="height: 10em;" data-ng-list="&#10;" data-ng-trim="false" data-ng-required="required" data-ng-change="onStepsChange()"></textarea>'
  link: (scope, element, attrs, ngModel) ->
    scope.currentLength = scope.$parent.$eval attrs.currentLength
    scope.required = scope.$parent.$eval attrs.valueRequired
    scope.workflowId = scope.$parent.$eval attrs.workflowId
    $(element).find('textarea').keypress (event,value)=>
      if event.which == 13 or event.keyCode == 13
        newStepNames = []
        _(scope.stepnames).each ((step,index)=>
          trimmedStep = step.trim()
          if trimmedStep.length > 0
            newIndex = Number(scope.currentLength) + index + 1
            searchString = "step "+ newIndex + ": "
            if not trimmedStep.startsWith(searchString)
              step = searchString + trimmedStep
            newStepNames.push step
        )
        scope.$apply(()=>
          scope.stepnames = newStepNames
        )

    scope.onStepsChange = ()=>
      newStepNamesWithoutPrefix = []
      _(scope.stepnames).each ((step,index)=>
        trimmedStep = step.trim()
        if trimmedStep.length > 0
          newIndex = Number(scope.currentLength) + index + 1
          searchString = "step "+ newIndex + ": "
          stepObj = {
            workflow_id: scope.workflowId
          }
          if not trimmedStep.startsWith(searchString)
            stepObj.name = trimmedStep
          else
            stepWithoutPrefix = trimmedStep.substr(searchString.length)
            stepObj.name = stepWithoutPrefix
          newStepNamesWithoutPrefix.push stepObj
      )
      ngModel.$setViewValue newStepNamesWithoutPrefix