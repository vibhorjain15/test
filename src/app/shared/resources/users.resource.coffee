angular.module('diligenceVault').factory 'UsersResource', (GridResourceService, Restangular, GridsDataService, BaseDataService, $templateCache) ->

  new class UsersResource

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    grid_widths_map = GridsDataService.getGridWidthsMap()
    $new: (options) ->
      resource = GridResourceService.$new(options)
      resource.name 'firms/'+options.firm_id+'/users?include_deleted=true',
      resource.enableFiltering()
      # resource.enableRowSelection({full_row_selection: false})
      # resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      # resource.enableColumnMenus()

      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setRowTemplate("user-row-template")
      resource.column('name').title('Name').setDefaultSort('asc').align('left').setTemplate('user-name').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('email').title('Email').setWidth(grid_widths_map['sm_column_sm']).setTemplate('user-email').filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('status').title('Status').setWidth(grid_widths_map['sm_column_sm']).setTemplate('user-status').filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('role').title('Role').setWidth(grid_widths_map['sm_column_sm']).setTemplate('user-roles').filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('functions').title('Functions').setWidth(grid_widths_map['sm_column_lg']).setTemplate('user-functions').filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('action').title('Action').disableSorting().setTemplate('user-actions').setWidth(grid_widths_map['sm_column_lg'])

      resource
