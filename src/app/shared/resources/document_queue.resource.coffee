angular.module('diligenceVault').factory 'DocumentQueueResource', (GridResourceService, GridsDataService) ->
  new class DocumentQueueResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'document_queue',
        owner: ->
          _([@owner.firstName, @owner.lastName]).compact().join(' ')

      resource.enableFiltering()
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.enableRowSelection({full_row_selection: false})

      resource.columnDefs.push(
        {
          grouping: { groupPriority: 0},
          name:'Name',
          visible: false,
          field: 'group_id'
        }
      )
      resource.column('group_name').title('Name').align('left').setTemplate('document-queue-name').setWidth(grid_widths_map['sm_column_lg']).filterable(true, {
        placeholder: 'Search by name'
      })
      resource.column('tag_ids').title('Document Type').setTemplate('workflow-tags').setWidth(grid_widths_map['sm_column_lg']).filterable(true, {
        placeholder: 'Search document type'
      })
      resource.column('entity_name').title('Associated Entity').setWidth(grid_widths_map['sm_column_lg'])
      resource.column('as_of_date').title('As of Date').disableColumnMenu().disableGrouping().format('date').setWidth(grid_widths_map['sm_column_xm']).setTemplate('document-queue-date')
      resource.column('owner_name').title('Owner').setWidth(grid_widths_map['sm_column_lg'])
      resource.column('action').title('Action').disableSorting().setTemplate('document-queue-action').setWidth(grid_widths_map['sm_column_xm'])

      resource
