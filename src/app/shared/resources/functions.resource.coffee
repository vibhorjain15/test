angular.module('diligenceVault').factory 'FunctionsResource', (GridResourceService, Restangular, GridsDataService, BaseDataService, $templateCache) ->

  new class FunctionsResource

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    grid_widths_map = GridsDataService.getGridWidthsMap()
    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.name "function_assignments",

      resource.enableFiltering()
      resource.enableRowSelection({full_row_selection: false})
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      # resource.enableColumnMenus()
      resource.addTransformer (collection) ->
        _(collection).map (func)=>
          func.users = _(func.user_assigments).pluck('user_name')
          func
        collection

      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setRowTemplate("user-row-template")
      resource.column('function_name').title('Name').setDefaultSort('asc').align('left').setTemplate('empty-cell').setWidth(grid_widths_map['sm_column_xm']).filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('users').title('Team Members').setWidth(grid_widths_map['lg_column_xl']).setTemplate('function-users').filterable(false, {
        placeholder: 'Search...'
      })
      resource.column('action').title('Action').disableSorting().setTemplate('function-actions').setWidth(grid_widths_map['sm_column_sm'])

      resource
