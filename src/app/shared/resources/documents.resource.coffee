angular.module('diligenceVault').factory 'DocumentsResource', (GridResourceService, GridsDataService, $rootScope, $templateCache,Utils) ->

  new class DocumentsResource

    # $templateCache.put('ui-grid/selectionRowHeaderButtons',
    #   "<div class=\"ui-grid-selection-row-header-buttons \" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><input class=\"styled ng-pristine ng-untouched ng-valid ng-empty\"  type=\"checkbox\" data-ng-model=\"row.entity.is_selected\" data-ng-click=\"grid.appScope.vm.selectButtonClick(row.entity)\">&nbsp;</div>"
    # );

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
          document.is_reviewed = if document.reviews and document.reviews.length > 0 then 'Yes' else 'No'
          document.reviewed_by = _(document.reviews).pluck('created_by_name')
          document.review_count = if document.reviews then document.reviews.length else 0
          document.last_reviewed_date = if document.reviews && document.reviews.length>0 then document.reviews[0].created_at else null
          document.associated_all_entities = []
          document.tag_labels = []
          document.tag_names = _(document.tag_names).sortBy((tag) =>
            tag.toLowerCase()
          )
          _(document.tag_names).forEach (tag) ->
            document.tag_labels.push tag.split('_').join(' ').replace(/\w\S*/g, (txt) ->
              return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            )

          _(document.associated_project_names).forEach (entity) ->
            document.associated_all_entities.push entity
          _(document.associated_fund_names).forEach (entity) ->
            document.associated_all_entities.push entity
          _(document.associated_firm_names).forEach (entity) ->
            document.associated_all_entities.push entity
          _(document.associated_strategy_names).forEach (entity) ->
            document.associated_all_entities.push entity
          _(document.associated_vehicle_names).forEach (entity) ->
            document.associated_all_entities.push entity

          # document.associated_all_entities = document.associated_all_entities.join(",")


        newCollection = []
        multipleGroupsDocuments = []
        noGroupsDocuments =  []
        _(collection).forEach (document) ->
          if document.group_ids.length > 0
            multipleGroupsDocuments.push document
          else
            noGroupsDocuments.push document

        _(multipleGroupsDocuments).forEach (document) ->
          groupNames = document.group_names
          groupIds = document.group_ids

          _(document.group_names).forEach (groupName, idx) ->
            documentCopy = angular.copy(document)
            documentCopy.group_name = [groupNames[idx]]
            documentCopy.group_id = [groupIds[idx]]

            newCollection.push documentCopy

        #concatenate the grouped and ungrouped data into a new collection and save it in the resource
        #earlier it was saving the concatenated items in the initial collection which was then returned to the controller.
        #which caused the duplicate row issue.
        #The issue started happening when we removed the initial grouping for this grid.
        groupedCollection = [].concat(noGroupsDocuments, newCollection)
        resource.updateSavedData('groupedData', groupedCollection)

        collection

      if options.q
        resource.name 'attachments/search'
      else
        resource.name 'attachments'

      # -----------------------
      resource.enableFiltering()
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      resource.enableRowSelection({full_row_selection: false})
      resource.enableColumnMenus()
      # ****************************************

      # resource.enableFiltering()
      # resource.enableRowSelection({full_row_selection: false})
      # resource.enableRowHeaderSelection(false)
      # resource.enableColumnMenus()
      # resource.setGridShowHideColumns(true)
      # resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})

      #for the date range filter to get data on date change, we need to enable date filtering
      resource.enableDateFiltering()

      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setRowTemplate("dd-project-row-template")

      resource.column('name').title('Document Name').align('left').setTemplate('document-name').setWidth(grid_widths_map['sm_column_xxl']).filterable(true, {
        placeholder: 'Search by Name'
      }).disableColumnMenu()
      resource.column('tag_labels').setWidth(grid_widths_map['sm_column_xxl']).title('Document Types').setTemplate('document-type-tags').setWidth(grid_widths_map['sm_column_xl']).align('center').filterable(true, {
        placeholder: 'Search Document Types'
      }).disableColumnMenu()
      resource.columnDefs.push(
        {
          name: 'as_of_date',
          displayName: 'As of Date',
          field: 'as_of_date',
          cellClass: 'text-center',
          headerCellClass: 'text-center',
          minWidth: grid_widths_map['sm_column_sm'],
          cellTemplate: "shared/ui-grid-cell-templates/as-of-date.html",
          enableFiltering: true,
          filter: {
            placeholder: 'Search by As of Date'
          }
          enableHiding: false
          enableColumnMenu:false,
          visible: true
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          type: 'date'
        }
      )
      resource.column('associated_all_entities').title('Associated Entities').align('left').setTemplate('groupable-field-name').setWidth(grid_widths_map['sm_column_xl']).filterable(true, {
        placeholder: 'Search by Name'
      }).disableColumnMenu()

      resource.columnDefs.push(
        {
          name: 'owner_firm_name',
          displayName: 'Owner Firm Name',
          field: 'owner_firm_name',
          cellClass: 'text-center',
          headerCellClass: 'text-center',
          minWidth: grid_widths_map['sm_column_sm'],
          cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
          enableFiltering: true,
          filter: {
            placeholder: 'Search by Firm Name'
          }
          enableHiding: false
          visible: true
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          menuItems: [
            {
              title: 'Group',
              shown: () ->
                return _.isEmpty @context.col.grouping
              action: ($event) ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Group', ({grid: 'AllDocuments', fieldName: fieldName})
            }
            {
              title: 'Ungroup',
              shown: () ->
                return !_.isEmpty @context.col.grouping
              action: () ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Ungroup', ({grid: 'AllDocuments', fieldName: fieldName})
            }
          ]
        }
      )
      resource.column('view_count').setWidth(grid_widths_map['icon_xl']).title('Views').disableColumnMenu()

      resource.columnDefs.push(
        {
          name: 'associated_project_names',
          displayName: 'Project Name',
          field: 'associated_project_names',
          cellClass: 'text-center',
          headerCellClass: 'text-center',
          minWidth: grid_widths_map['sm_column_sm'],
          cellTemplate: "shared/ui-grid-cell-templates/groupable-field-name.html",
          enableFiltering: true,
          filter: {
            placeholder: 'Search by Project Name'
          }
          enableHiding: false
          visible: true
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          menuItems: [
            {
              title: 'Group',
              shown: () ->
                return _.isEmpty @context.col.grouping
              action: ($event) ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Group', ({grid: 'AllDocuments', fieldName: fieldName})
            }
            {
              title: 'Ungroup',
              shown: () ->
                return !_.isEmpty @context.col.grouping
              action: () ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Ungroup', ({grid: 'AllDocuments', fieldName: fieldName})
            }
          ]
        }
      )
      resource.columnDefs.push(
        {
          name: 'associated_template_names',
          displayName: 'Template Name',
          field: 'associated_template_names',
          cellClass: 'text-center',
          headerCellClass: 'text-center',
          minWidth: grid_widths_map['sm_column_sm'],
          cellTemplate: "shared/ui-grid-cell-templates/groupable-field-name.html",
          enableFiltering: true,
          filter: {
            placeholder: 'Search by Template Name'
          }
          enableHiding: false
          visible: true
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          menuItems: [
            {
              title: 'Group',
              shown: () ->
                return _.isEmpty @context.col.grouping
              action: ($event) ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Group', ({grid: 'AllDocuments', fieldName: fieldName})
            }
            {
              title: 'Ungroup',
              shown: () ->
                return !_.isEmpty @context.col.grouping
              action: () ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Ungroup', ({grid: 'AllDocuments', fieldName: fieldName})
            }
          ]
        }
      )

      resource.column('blob_name').title('File Name').align('left').setWidth(grid_widths_map['sm_column_xl']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search by File Name'
      }).disableColumnMenu()
#      resource.column('owner_firm_name').setWidth(grid_widths_map['sm_column_sm']).title('Firm Name').disableColumnMenu()
#      resource.column('as_of_date').setWidth(grid_widths_map['sm_column_sm']).title('As of Date').format('date')
#      resource.column('created_by_name').setWidth(grid_widths_map['sm_column_sm']).title('Uploaded By')
      resource.columnDefs.push(
        {
          name: 'created_by_name',
          displayName: 'Uploaded By',
          field: 'created_by_name',
          cellClass: 'text-center',
          headerCellClass: 'text-center',
          minWidth: grid_widths_map['sm_column_sm'],
          cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
          enableFiltering: true,
          filter: {
            placeholder: 'Search by Uploader'
          }
          enableHiding: false
          visible: true
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          menuItems: [
            {
              title: 'Group',
              shown: () ->
                return _.isEmpty @context.col.grouping
              action: ($event) ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Group', ({grid: 'AllDocuments', fieldName: fieldName})
            }
            {
              title: 'Ungroup',
              shown: () ->
                return !_.isEmpty @context.col.grouping
              action: () ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Ungroup', ({grid: 'AllDocuments', fieldName: fieldName})
            }
          ]
        }
      )
      resource.columnDefs.push(
        {
          name: 'group_name',
          displayName: 'Group Name',
          field: 'group_name',
          cellClass: 'text-left',
          headerCellClass: 'text-left',
          minWidth: grid_widths_map['sm_column_sm'],
          enableFiltering: true,
          cellTemplate: "shared/ui-grid-cell-templates/groupable-group-name.html",
          filter: {
            placeholder: 'Search by Group'
          }
          enableHiding: false
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          visible: false
          isDuplicate: true
          groupedColumnName: 'group_name'
          menuItems: [
            {
              title: 'Group',
              shown: () ->
                return _.isEmpty @context.col.grouping
              action: ($event) ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Group', ({grid: 'AllDocuments', fieldName: fieldName})
            }
            {
              title: 'Ungroup',
              shown: () ->
                return !_.isEmpty @context.col.grouping
              action: () ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Ungroup', ({grid: 'AllDocuments', fieldName: fieldName})
            }
          ]
        }
      )
      resource.columnDefs.push(
        {
          name: 'group_names',
          displayName: 'Group Names',
          field: 'group_names',
          cellClass: 'text-left',
          headerCellClass: 'text-left',
          minWidth: grid_widths_map['sm_column_sm'],
          enableFiltering: true,
          cellTemplate: "shared/ui-grid-cell-templates/groupable-group-name.html",
          filter: {
            placeholder: 'Search by Group'
          }
          enableHiding: false
          groupingShowAggregationMenu: false
          groupingShowGroupingMenu: false
          visible: true
          isOriginal: true
          groupedColumnName: 'group_name'
          menuItems: [
            {
              title: 'Group',
              shown: () ->
                return _.isEmpty @context.col.grouping
              action: ($event) ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Group', ({grid: 'AllDocuments', fieldName: fieldName})
            }
            {
              title: 'Ungroup',
              shown: () ->
                return !_.isEmpty @context.col.grouping
              action: () ->
                fieldName = @context.col.field
                $rootScope.$emit 'Grid:Ungroup', ({grid: 'AllDocuments', fieldName: fieldName})
            }
          ]
        }
      )
      resource.column('is_reviewed').setWidth(grid_widths_map['sm_column_sm']).title('Reviewed').setVisibility(false).setTemplate('empty-cell').showAggregationOptions(false)
      resource.column('reviewed_by').setWidth(grid_widths_map['sm_column_sm']).title('Reviewed By').setVisibility(false).setTemplate('reviewed-by-name').showAggregationOptions(false)
      resource.column('review_count').setWidth(grid_widths_map['sm_column_sm']).title('# of Reviews').setVisibility(false).disableGrouping().setTemplate('empty-cell')
      resource.column('last_reviewed_date').setWidth(grid_widths_map['sm_column_sm']).title('Review Date').setVisibility(false).disableGrouping().setTemplate('reviewed-date')

      resource.column('action').setWidth(grid_widths_map['sm_column_sm']).title('Action').disableSorting().setTemplate('document-action').disableColumnMenu()

      resource
