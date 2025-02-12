angular.module('diligenceVault').factory 'WorkflowsResource', (GridResourceService, Restangular, GridsDataService, BaseDataService) ->
  new class WorkflowsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) ->
        BaseDataService.getAttachmentTypes().then (response) =>
          document_types = response
          _(collection).each (item) =>
            tag_ids = []
            _(document_types).each (doc_type) =>
              if doc_type.id  == item.entity_sub_type
                tag_ids.push(doc_type.name)

            item.tag_ids = tag_ids

      resource.name 'workflows',
      resource.enableFiltering()
      #resource.setServerPaginated(true)
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setRowTemplate("dd-project-row-template")
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.column('name').disableColumnMenu().disableGrouping().title('Name').setDefaultSort('asc').align('left').setTemplate('workflow-name').setWidth(grid_widths_map['sm_column_sm']).filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('entity_type').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Reference Entity').setWidth(grid_widths_map['sm_column_sm']).setTemplate('resource-type')
      resource.column('tag_name').disableColumnMenu().disableGrouping().setDefaultSort('asc').title('Tag').setTemplate('workflow-tags').setWidth(grid_widths_map['sm_column_sm'])
      resource.column('usage').disableColumnMenu().disableGrouping().title('Usage').setWidth(grid_widths_map['sm_column_sm'])
      resource.column('created_at').disableColumnMenu().disableGrouping().title('Last Updated').format('date').setWidth(grid_widths_map['sm_column_sm']).setTemplate('workflow-created-at')
      resource.column('action').disableColumnMenu().disableGrouping().title('Action').disableSorting().setTemplate('workflowlist-action').setWidth(grid_widths_map['sm_column_xm'])

      resource
