angular.module('diligenceVault').factory 'DocumentGroupedResource', (GridResourceService, GridsDataService) ->
  new class DocumentGroupedResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'document_group',
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
          name: 'group_name',
          displayName: 'Name',
          field: 'group_name',
          cellClass: 'text-left',
          headerCellClass: 'text-left',
          width: grid_widths_map['sm_column_lg'],
          enableFiltering: true,
          visible: true,
          cellTemplate: "shared/ui-grid-cell-templates/document-name.html",
          filter: {
            placeholder: 'Search by name'
          }
        }
      )
      resource.column('tag_ids').title('Document Type').setTemplate('workflow-tags').filterable(true, {
        placeholder: 'Search document type'
      })
      resource.column('as_of_date').title('As of Date').disableColumnMenu().disableGrouping().format('date').setWidth(grid_widths_map['sm_column_sm']).align('center')
      resource.column('created_by_name').title('Uploaded By').setWidth(grid_widths_map['sm_column_xl'])
      resource.column('view_count').title('Views').setWidth(grid_widths_map['icon_xl']).align('center')
      resource.column('action').title('Action').disableSorting().setTemplate('document-list-conditional-action').setWidth(grid_widths_map['sm_column_xm']).align('center')


      resource.column('owner_name').title('Owner')
      resource.column('action').title('Action').disableSorting().setTemplate('document-queue-action').setWidth(grid_widths_map['sm_column_xm'])
      resource.columnDefs.push(
        {
          grouping: { groupPriority: 0},
          name:'Name',
          visible: false,
          field: 'group_id'
        }
      )


      resource
