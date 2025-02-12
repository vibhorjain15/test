angular.module('diligenceVault').directive 'dvQuestionBuilder', ->
  restrict: 'E'
  scope: true
  require: 'ngModel'
  template: '<textarea data-ng-model="questionNames" class="form-control" style="height: 10em;" data-ng-list="&#10;" data-ng-trim="false" data-ng-required="required" data-ng-change="onStepsChange()"></textarea>'
  link: (scope, element, attrs, ngModel) ->
    scope.currentLength = scope.$parent.$eval attrs.currentLength
    scope.required = scope.$parent.$eval attrs.valueRequired
    scope.subCategoryId = scope.$parent.$eval attrs.subCategoryId
    $(element).find('textarea').keypress (event,value)=>
      if event.which == 13 or event.keyCode == 13
        newQuestionNames = []
        _(scope.questionNames).each ((question,index)=>
          trimmedQuestion = question.trim()
          if trimmedQuestion.length > 0
            newIndex = Number(scope.currentLength) + index + 1
            searchString = "question "+ newIndex + ": "
            if not trimmedQuestion.startsWith(searchString)
              question = searchString + trimmedQuestion
            newQuestionNames.push question
        )
        scope.$apply(()=>
          scope.questionNames = newQuestionNames
        )

    scope.onStepsChange = ()=>
      newQuestionNamesWithoutPrefix = []
      _(scope.questionNames).each ((question,index)=>
        trimmedQuestion = question.trim()
        if trimmedQuestion.length > 0
          newIndex = Number(scope.currentLength) + index + 1
          searchString = "question "+ newIndex + ": "
          questionObj = {
            id: scope.subCategoryId
          }
          if not trimmedQuestion.startsWith(searchString)
            questionObj.name = trimmedQuestion
          else
            questionWithoutPrefix = trimmedQuestion.substr(searchString.length)
            questionObj.name = questionWithoutPrefix
          newQuestionNamesWithoutPrefix.push questionObj
      )
      ngModel.$setViewValue newQuestionNamesWithoutPrefix
