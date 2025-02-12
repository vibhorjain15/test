angular.module('diligenceVault').factory 'TemplatesResource', (GridResourceService, Utils, GridsDataService) ->

  entity_sub_type = Utils.getEntitySubType()
  grid_widths_map = GridsDataService.getGridWidthsMap()

  new class TemplatesResource
    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'templates'

      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('templateInfo.name').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xl']).setDefaultSort('asc').title('Name').setTemplate('template-name').align('left').filterable(true, {
        placeholder: 'Search template'
      })
      resource.column('type').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xm']).title('Type').setTemplate('template-type')
      resource.column('templateInfo.is_draft').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xm']).title('Status').setTemplate('template-draft')
      resource.column('strategy').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xxm']).title('Classification').setTemplate('template-strategy')
      resource.column('templateInfo.ownership').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xm']).title('Ownership').setTemplate('template-ownership')
      resource.column('questionCount').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).title('# of Questions').format 'number'
      resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xm']).title('Last Updated At').format('date').setTemplate 'last-updated-at'

      resource
