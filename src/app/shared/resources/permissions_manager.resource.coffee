angular.module('diligenceVault').factory 'PermissionsManager', (GridResourceService, GridsDataService,uiGridConstants, keywordConstants, Utils, $templateCache) ->
  new class PermissionsManager

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    grid_widths_map = GridsDataService.getGridWidthsMap()
    $new: (options) ->
      is_manager = Utils.isManager()
      selectOptions = [
        {value: keywordConstants.Project, label: 'Project'}
        {value: keywordConstants.Product, label: 'Product'}
        {value: keywordConstants.Template, label: 'Template'}
      ]
      firmObj =  {}
      firmObj.value = keywordConstants.Firm
      firmObj.label = if is_manager then 'Investor' else 'Firm'
      selectOptions.push firmObj

      resource = GridResourceService.$new(options)
      resource.name 'firms/'+options.firm_id+'/resourcepermissions'
      # resource.setServerPaginated(true)

      resource.enableFiltering()
      resource.enableRowSelection({full_row_selection: false})
      resource.setGridName('permissions_grid')
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")
      # resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()
      resource.setRowTemplate("dd-project-row-template")
      resource.column('entity_name').align('left').showAggregationOptions(false).enableHiding(false).title('Resource').setWidth(grid_widths_map['sm_column_xm']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search Resource'
      })
      # resource.column('entity_name').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xm']).setTemplate('resource-list').title 'Resource'
      resource.column('entity_type').showAggregationOptions(false).enableHiding(false).title('Resource Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('resource-type').filterable(true, {
        placeholder: 'Search Type'
      })
      .filterable(true, {
          type: uiGridConstants.filter.SELECT
          selectOptions: selectOptions
        })

      # resource.column('entity_type').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xxm']).setTemplate('empty-cell').title 'Resource Type'
      resource.column('assigned_to_name').showAggregationOptions(false).enableHiding(false).title('Assigned To').setWidth(grid_widths_map['sm_column_xm']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search Members'
      })
      resource.column('assigned_to_entity_type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xxm']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search Type'
      })
      resource.column('role_name').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xxm']).setTemplate('empty-cell').title('Access Level').filterable(true, {
        placeholder: 'Search Access Level'
      })
      resource.column('access_level').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xxm']).setTemplate('visibility-column').title('Visibility').filterable(true, {
        placeholder: 'Search Visibility'
      })
      resource.column('created_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).setTemplate('resource-list-updated').title 'Last updated'
      resource.column('action').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).setTemplate('resource-list-action').title 'Action'


      resource
