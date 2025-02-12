angular.module('diligenceVault').factory 'DueDiligenceInvestor', (GridResourceService, Utils, GridsDataService,$templateCache) ->

  entity_sub_type = Utils.getEntitySubType()
  grid_widths_map = GridsDataService.getGridWidthsMap()

  currentFirm = Utils.getCurrentFirm()

  new class DueDiligenceInvestor
    computedDueDateClass = (grid, row, col) ->
      today = moment()
      due_at = moment(grid.getCellValue(row, col))

      if due_at < today then 'text-danger' else ''

    $templateCache.put('ui-grid/selectionRowHeaderButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
    );


    $templateCache.put('ui-grid/selectionSelectAllButtons',
      "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
    );

    $new: (options) ->

      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) ->
        _(collection).each (response) ->
          if response.type == 'dd_review'
            response['d-type'] = 'Analyst Evaluation'
          else if response.type == 'inbound'
            response['d-type'] = 'Opportunity'
          else if response.is_internal && response.type != 'dd_review'
            response['d-type'] = 'Internal'
          else
            response['d-type'] = 'External'
          if response.status == 'Invited' && response.fromfirm_id == currentFirm.id
            response['d-status'] = 'Sent'
          else
            response['d-status'] = response.status.replace(/([a-z])([A-Z])/g, '$1 $2'); #This code converts TestString into Test String

      resource.name 'service/dvapi_service/diligence_search',
        fullName: ->
          [@created_by.firstName, @created_by.lastName].join ' '

      resource.usePostMethod()

      resource.enableFiltering()
      resource.enableRowSelection({full_row_selection: false})
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      resource.enableColumnMenus()

      #for the date range filter to get data on date change, we need to enable date filtering
      resource.enableDateFiltering()
      resource.setGridNullLabel("Ungrouped")

      switch options.type
        when 'my projects'
          resource.setRowTemplate("dd-project-invite-row-template")
          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('dd-fund-name').align('left').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('name').showAggregationOptions(false).enableHiding(false).title('Project Name').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-name').filterable(true, {
            placeholder: 'Search Project'
          })
          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name-invited').filterable(true, {
            placeholder: 'Search by Template'
          })
          resource.column('due_at').disableColumnMenu().disableGrouping().title('Due Date').setWidth(grid_widths_map['sm_column_xm']).format('date').setCellClass computedDueDateClass
          resource.column('d-status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_xm']).setDefaultSort('asc').setSortingAlgorithm(Utils.sortProjectsByStatus).setTemplate('dd-status-label').filterable(true, {
            placeholder: 'Search Status'
          })

          resource.columnDefs.push(
            {
              name: 'key',
              displayName: 'Internal Key',
              field: 'key',
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_xl'],
              cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
              enableFiltering: true,
              filter:
                placeholder: 'Search Internal Key'
              enableHiding: false
              visible: false
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
            }
          )

          resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
            placeholder: 'Search Type'
          })
          resource.column('percentage_completed').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-percentage').format 'number'
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'
          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'

          resource.column('statusIcon').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['icon_xs']).disableSorting().setTemplate('dd-status-icon-investor').setEmptyTitle().title ''
        when 'in-progress'
          resource.setRowTemplate("dd-project-invite-row-template")
          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').align('left').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-fund-name').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('name').showAggregationOptions(false).enableHiding(false).title('Project Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-name').filterable(true, {
            placeholder: 'Search Project'
          })
          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name-invited').filterable(true, {
            placeholder: 'Search by Template'
          })

          resource.column('due_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).format('date').title('Due Date').setTemplate 'dd-due-date'
          resource.column('as_of_date').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).format('date').title('As of Date').setTemplate 'dd-asof-date'

          resource.columnDefs.push(
            {
              name: 'key',
              displayName: 'Internal Key',
              field: 'key',
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_xl'],
              cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
              enableFiltering: true,
              filter:
                placeholder: 'Search Internal Key'
              enableHiding: false
              visible: false
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
            }
          )

          resource.column('d-status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_xm']).setDefaultSort('asc').setSortingAlgorithm(Utils.sortProjectsByStatus).setTemplate('dd-status-label').filterable(true, {
            placeholder: 'Search Status'
          })

          resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
            placeholder: 'Search Type'
          })
          # resource.column('type').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xl']).setTemplate 'dd-type'
          resource.column('percentage_completed').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-percentage').format 'number'
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'
          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'

          resource.column('statusIcon').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['icon_xs']).disableSorting().setTemplate('dd-status-icon-investor').setEmptyTitle().title ''
        when 'closed'
          # resource.enableRowHeaderSelection(false)
          resource.setRowTemplate("dd-project-row-template")

          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Entity Name').setWidth(grid_widths_map['sm_column_sm']).align('left').setTemplate('dd-fund-name').align('left').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('name').showAggregationOptions(false).enableHiding(false).title('Project Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-name').filterable(true, {
            placeholder: 'Search Project'
          })
          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name').filterable(true, {
            placeholder: 'Search by Template'
          })
          resource.column('as_of_date').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).format('date').title 'As of Date'
          resource.column('d-status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-status-label').filterable(true, {
            placeholder: 'Search Status'
          })

          resource.columnDefs.push(
            {
              name: 'key',
              displayName: 'Internal Key',
              field: 'key',
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_xl'],
              cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
              enableFiltering: true,
              filter:
                placeholder: 'Search Internal Key'
              enableHiding: false
              visible: false
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
            }
          )

          resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
            placeholder: 'Search Type'
          })
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          # resource.column('type').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xl']).setTemplate 'dd-type'
          resource.column('closed_at').disableColumnMenu().disableGrouping().title('Closed On').setWidth(grid_widths_map['sm_column_xxm']).format 'date'
        when 'sent'
          resource.column('entity_name').align('left').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Entity Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('name').showAggregationOptions(false).enableHiding(false).title('Project Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-name').filterable(true, {
            placeholder: 'Search Project'
          })
          resource.column('due_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title 'Due Date'
          resource.column('as_of_date').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title 'As of Date'
          resource.column('tofirm_name').showAggregationOptions(false).enableHiding(false).filterable(true).title('To Firm').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search Firm'
          })

          resource.columnDefs.push(
            {
              name: 'key',
              displayName: 'Internal Key',
              field: 'key',
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_xl'],
              cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
              enableFiltering: true,
              filter:
                placeholder: 'Search Internal Key'
              enableHiding: false
              visible: false
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
            }
          )

          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-questionnaire-name').filterable(true, {
            placeholder: 'Search by Template'
          })
          resource.column('created_at').disableColumnMenu().disableGrouping().title('Sent Date').setWidth(grid_widths_map['sm_column_lg']).setTemplate('dd-date-field').format 'date'
          resource.column('created_by_name').showAggregationOptions(false).enableHiding(false).title('Sent By').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search Sender'
          })
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'
          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'
          resource.column('sentAction').disableColumnMenu().disableGrouping().title('Action').setWidth(grid_widths_map['sm_column_xxl']).setTemplate 'dd-sent-action'
        when 'all'
          resource.setRowTemplate("dd-project-invite-row-template")
          resource.column('entity_name').showAggregationOptions(false).align('left').enableHiding(false).title('Entity Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-fund-name').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('name').showAggregationOptions(false).enableHiding(false).title('Project Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-name').filterable(true, {
            placeholder: 'Search Project'
          })

          resource.column('tofirm_name').showAggregationOptions(false).enableHiding(false).filterable(true).title('To Firm').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search Firm'
          })

          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name-invited').filterable(true, {
            placeholder: 'Search by Template'
          })

          resource.column('created_at').disableColumnMenu().disableGrouping().title('Sent Date').setWidth(grid_widths_map['sm_column_xxm']).setTemplate('dd-date-field').format 'date'

          resource.columnDefs.push(
            {
              name: 'key',
              displayName: 'Internal Key',
              field: 'key',
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_xl'],
              cellTemplate: "shared/ui-grid-cell-templates/empty-cell.html",
              enableFiltering: true,
              filter:
                placeholder: 'Search Internal Key'
              enableHiding: false
              visible: false
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
            }
          )

          resource.column('created_by_name').showAggregationOptions(false).enableHiding(false).title('Sent By').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search Sender'
          })

          resource.column('due_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).format('date').title('Due Date').setTemplate 'dd-due-date'
          resource.column('as_of_date').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).format('date').title('As of Date').setTemplate 'dd-asof-date'
          resource.column('d-status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_xm']).setDefaultSort('asc').setSortingAlgorithm(Utils.sortProjectsByStatus).setTemplate('dd-status-label').filterable(true, {
            placeholder: 'Search Status'
          })
          resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
            placeholder: 'Search Type'
          })
          resource.column('percentage_completed').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-percentage').format 'number'
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'
          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'
          resource.columnDefs.push(
            {
              name: 'sentAction',
              displayName: 'Action',
              field: 'sentAction',
              cellClass: 'text-center',
              headerCellClass: 'text-center',
              width: grid_widths_map['sm_column_xxl'],
              cellTemplate: "shared/ui-grid-cell-templates/dd-sent-action.html",
              enableFiltering: false,
              enableHiding: false
              visible: false
              groupingShowAggregationMenu: false
              groupingShowGroupingMenu: false
            }
          )
          resource.column('statusIcon').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['icon_xs']).disableSorting().setTemplate('dd-status-icon-investor').setEmptyTitle().title ''
      resource
