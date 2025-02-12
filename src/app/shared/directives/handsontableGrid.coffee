angular.module('diligenceVault').directive 'handsontableGrid', () ->
  restrict: 'E'
  scope: 
    gridId: '<'
    settings: '='
    columns: '='
    datarows: '='
    instance: '='
  link: (scope, element, attrs) ->
    scope.settings.columns = scope.columns if scope.columns
    renderGrid = (grid)=>
      if scope.instance
        scope.instance.updateSettings(scope.settings)
      else
        container = document.createElement('div')
        if scope.settings.hotId
          container.id = scope.settings.hotId
        element[0].appendChild(container)
        scope.instance = new Handsontable(container,scope.settings)
    
    scope.$watchCollection 'datarows',(value)=>
      if value
        scope.settings.data = value
        renderGrid()