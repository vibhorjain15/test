angular.module('diligenceVault').factory 'ScheduledDiligenceResource', (GridResourceService, GridsDataService,$templateCache) ->

  new class ScheduledDiligenceResource

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    grid_widths_map = GridsDataService.getGridWidthsMap()

    computedDueDateClass = (grid, row, col) ->
      today = moment()
      due_at = moment(grid.getCellValue(row, col))

      if due_at < today then 'text-danger' else ''

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'diligences',

      resource.enableFiltering()
      resource.enableRowSelection({full_row_selection: false})
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      # resource.column('is_selected').setWidth(grid_widths_map['icon_lg']).disableSorting().setTemplate('dd-selector').setHeaderTemplate('dd-selector').title ''
      resource.column('scheduled_for').disableColumnMenu().disableGrouping().title('Scheduled Date').setWidth(grid_widths_map['sm_column_xm']).format('date').align('left')
      resource.column('entity_name').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Entity Name').setWidth(grid_widths_map['lg_column_xxm']).setTemplate('dd-fund-name').align('left').filterable(true, {
        placeholder: 'Search by name'
      })
      resource.column('name').showAggregationOptions(false).enableHiding(false).title('Project Name').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-name').filterable(true, {
        placeholder: 'Search Project'
      })
      resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Questionnaire').setWidth(grid_widths_map['sm_column_xxl']).setTemplate('dd-questionnaire-name').filterable(true, {
        placeholder: 'Search by questionnaire'
      })
      resource.column('due_at').disableColumnMenu().disableGrouping().title('Due Date').setWidth(grid_widths_map['sm_column_xm']).format('date').setCellClass computedDueDateClass

      resource
