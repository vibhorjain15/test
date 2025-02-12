angular.module('diligenceVault').factory 'DocumentListResource', (GridResourceService, GridsDataService, BaseDataService, $templateCache) ->
  new class DocumentListResource

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.modifyDataFunction (collection) ->

        collection.forEach (document) ->
          document.tag_labels = []
          document.tag_names = _(document.tag_names).sortBy((tag) =>
            tag.toLowerCase()
          )
          _(document.tag_names).forEach (tag) ->
            document.tag_labels.push tag.split('_').join(' ').replace(/\w\S*/g, (txt) ->
              return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            )

        newCollection = []
        multipleGroupsDocuments = _(collection).filter (document) -> document.group_ids.length > 1
        notMultipleGroupsDocuments = _(collection).filter (document) -> document.group_ids.length <= 1

        _(multipleGroupsDocuments).forEach (document) ->
          groupNames = document.group_names
          groupIds = document.group_ids

          _(document.group_names).forEach (groupName, idx) ->
            documentCopy = angular.copy(document)
            documentCopy.group_names = [groupNames[idx]]
            documentCopy.group_ids = [groupIds[idx]]

            newCollection.push documentCopy

        #concatenate the grouped and ungrouped data into a new collection and save it in the resource
        #earlier it was saving the concatenated items in the initial collection which was then returned to the controller.
        #which caused the duplicate row issue.
        #The issue started happening when we removed the initial grouping for this grid.
        groupedCollection = [].concat(notMultipleGroupsDocuments, newCollection)
        resource.updateSavedData('groupedData', groupedCollection)


        collection

      if options.q
        resource.name 'attachments/search'
      else
        resource.name 'attachmentassignments'

      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setRowTemplate("dd-project-row-template")
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableRowSelection({full_row_selection: false})
      resource.enableColumnMenus()

      resource.column('name').disableColumnMenu().setWidth(grid_widths_map['sm_column_xl']).title('Document Name').setTemplate('document-tags').align('center').filterable(true, {
        placeholder: 'Search by name'
      })
      resource.column('blob_name').title('File Name').align('left').setWidth(grid_widths_map['sm_column_xl']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search by File Name'
      }).disableColumnMenu()
      resource.column('tag_names').disableColumnMenu().disableSorting().setWidth(grid_widths_map['sm_column_xxl']).title('Document Types').setTemplate('document-type-tags').align('center').filterable(true, {
        placeholder: 'Search documents'
      })
      resource.column('as_of_date').showAggregationOptions(false).enableHiding(false).title('As of Date').disableColumnMenu().disableGrouping().format('date').setWidth(grid_widths_map['sm_column_sm']).align('center').setTemplate('empty-cell')
      resource.column('created_by_name').showAggregationOptions(false).enableHiding(false).title('Uploaded By').setWidth(grid_widths_map['sm_column_xl']).setTemplate('empty-cell')
      resource.column('view_count').disableColumnMenu().disableSorting().title('Views').setWidth(grid_widths_map['icon_xl']).align('center')
      resource.column('action').disableColumnMenu().title('Action').disableSorting().setTemplate('document-list-conditional-action').setWidth(grid_widths_map['sm_column_sm']).align('center')

      resource
