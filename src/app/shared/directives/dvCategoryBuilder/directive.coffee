angular.module('diligenceVault').directive 'dvCategoryBuilder', ->
  restrict: 'E'
  scope: true
  require: 'ngModel'
  template: '<textarea data-ng-model="categorynames" class="form-control" style="height: 10em;" data-ng-list="&#10;" data-ng-trim="false" data-ng-required="required" data-ng-change="onStepsChange()"></textarea>'
  link: (scope, element, attrs, ngModel) ->
    scope.currentLength = scope.$parent.$eval attrs.currentLength
    scope.required = scope.$parent.$eval attrs.valueRequired
    scope.categoryId = scope.$parent.$eval attrs.categoryId
    $(element).find('textarea').keypress (event,value)=>
      if event.which == 13 or event.keyCode == 13
        newCategoryNames = []
        _(scope.categorynames).each ((category,index)=>
          trimmedCategory = category.trim()
          if trimmedCategory.length > 0
            newIndex = Number(scope.currentLength) + index + 1
            searchString = "category "+ newIndex + ": "
            if not trimmedCategory.startsWith(searchString)
              category = searchString + trimmedCategory
            newCategoryNames.push category
        )
        scope.$apply(()=>
          scope.categorynames = newCategoryNames
        )

    scope.onStepsChange = ()=>
      newCategoryNamesWithoutPrefix = []
      _(scope.categorynames).each ((category,index)=>
        trimmedCategory = category.trim()
        if trimmedCategory.length > 0
          newIndex = Number(scope.currentLength) + index + 1
          searchString = "category "+ newIndex + ": "
          categoryObj = {
            id: scope.categoryId
          }
          if not trimmedCategory.startsWith(searchString)
            categoryObj.name = trimmedCategory
          else
            categoryWithoutPrefix = trimmedCategory.substr(searchString.length)
            categoryObj.name = categoryWithoutPrefix
          newCategoryNamesWithoutPrefix.push categoryObj
      )
      ngModel.$setViewValue newCategoryNamesWithoutPrefix
