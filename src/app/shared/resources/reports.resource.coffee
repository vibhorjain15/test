angular.module('diligenceVault').factory 'ReportsManager', (GridResourceService, BaseDataService, GridsDataService, Utils) ->
  new class MyAdminsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
        resource = GridResourceService.$new()
        resource.addTransformer (collection) ->
          _(collection).each (response) ->
            if response.entity_type == 'Report'
              response['entity_type_alias'] = 'WORD REPORT'
            else
              response['entity_type_alias'] = 'DV REPORT'
            if response.as_of_date
              response.as_of_date = Utils.getLocalDateTime(response.as_of_date).toDate()

        resource.name 'reports',
        resource.enableFiltering()
        resource.colDefaults(
            align: 'center'
            filterable: false
        )

        resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
        resource.setRowTemplate("permissions-row-template")

        resource.column('name').title('Report Name').align('left').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by name'
        })
        resource.column('entity_type_alias').title('Report Type').align('center').setTemplate('report-entity-type').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by type'
        })
        resource.column('report_template_name').title('Definition Name').align('center').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by definition'
        })
        resource.column('created_by_name').title('Created By').align('center').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
            placeholder: 'Search by created'
        })

        resource.column('as_of_date').format('date').setDefaultSort('desc').disableGrouping().title('As of Date').setWidth(grid_widths_map['sm_column_sm'])
        resource.column('action').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).title('Actions').align('center').disableSorting().setTemplate('report-template-actions').disableColumnMenu()

        resource
