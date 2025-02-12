angular.module('diligenceVault').factory 'DueDiligenceManager', (GridResourceService, Utils, GridsDataService,$templateCache) ->

  entity_type = Utils.getEntityType()
  entity_user_type = if entity_type == 'Product' then 'Client' else 'Investor'
  grid_widths_map = GridsDataService.getGridWidthsMap()
  isFreeManager = Utils.isFreeManager()

  currentFirm = Utils.getCurrentFirm()

  new class DueDiligenceManager
    computedDueDateClass = (grid, row, col) ->
      today = moment()
      due_date = moment(grid.getCellValue(row, col))

      if (due_date < today) then 'text-danger' else ''

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
            response['d-type'] = 'Opinion'
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

      resource.enableFiltering()
      resource.enableRowSelection({full_row_selection: false})
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.usePostMethod()
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      resource.enableColumnMenus()
      #for the date range filter to get data on date change, we need to enable date filtering
      resource.enableDateFiltering()
      resource.setGridNullLabel("Ungrouped")

      switch options.type
        when 'my projects'
          resource.setRowTemplate("dd-project-invite-row-template")

          resource.column('investor_firm_name').showAggregationOptions(false).enableHiding(false).title(entity_user_type+' Name').setWidth(grid_widths_map['sm_column_lg']).align('left').setTemplate('dd-firm-name').filterable(true, {
            placeholder: 'Search '+entity_user_type
          })
          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('dd-entity-name').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name-invited').filterable(true, {
            placeholder: 'Search by Template'
          })
          resource.column('due_at').disableColumnMenu().disableGrouping().title('Due Date').setWidth(grid_widths_map['sm_column_xm']).format('date').setCellClass computedDueDateClass
          resource.column('question_count').disableColumnMenu().disableGrouping().title('# of Questions').setWidth(grid_widths_map['sm_column_xm']).format 'number'

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
          if !isFreeManager
            resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
              placeholder: 'Search Type'
          })
          resource.column('percentage_completed').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-percentage').format 'number'
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'
          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'

          resource.column('statusIcon').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['icon_xs']).disableSorting().setTemplate('dd-status-icon-manager').setEmptyTitle().title ''
        when 'in-progress'
          resource.setRowTemplate("dd-project-invite-row-template")

          resource.column('investor_firm_name').showAggregationOptions(false).enableHiding(false).title(entity_user_type+' Name').setWidth(grid_widths_map['sm_column_sm']).align('left').setTemplate('dd-firm-name').filterable(true, {
            placeholder: 'Search '+entity_user_type
          })
          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('dd-entity-name').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name-invited').filterable(true, {
            placeholder: 'Search by Template'
          })
          resource.column('due_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).format('date').title('Due Date').setTemplate 'dd-due-date'
          resource.column('question_count').disableColumnMenu().disableGrouping().title('# of Questions').setWidth(grid_widths_map['sm_column_xxm']).format 'number'

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
          if !isFreeManager
            resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
              placeholder: 'Search Type'
            })
          resource.column('percentage_completed').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-percentage').format 'number'
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'
          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'

          resource.column('statusIcon').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['icon_xs']).disableSorting().setTemplate('dd-status-icon-manager').setEmptyTitle().title ''

        when 'closed'
          # resource.enableRowHeaderSelection(try)
          resource.setRowTemplate("dd-project-row-template")

          resource.column('investor_firm_name').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title(entity_user_type+' Name').align('left').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-firm-name').filterable(true, {
            placeholder: 'Search '+entity_user_type
          })
          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-entity-name').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('as_of_date').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title 'As of Date'
          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_lg']).setTemplate('dd-questionnaire-name').filterable(true, {
            placeholder: 'Search by Template'
          })
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

          if !isFreeManager
            resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
              placeholder: 'Search Type'
            })
          resource.column('last_updated_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Updated At').setTemplate 'last-updated-at'
          resource.column('closed_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).title('Closed On').format 'date'
        when 'sent'
          # resource.enableRowHeaderSelection(false)

          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).setDefaultSort('asc').title('Entity Name').setWidth(grid_widths_map['sm_column_lg']).align('left').setTemplate('dd-entity-name').filterable(true, {
            placeholder: 'Search Entity'
          })
          resource.column('tofirm_name').showAggregationOptions(false).enableHiding(false).title('To Firm').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search '+entity_user_type
          })
          resource.column('created_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xm']).title('Sent Date').format 'date'
          resource.column('created_by_name').showAggregationOptions(false).enableHiding(false).title('Sent By').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search Sender'
          })
          resource.column('last_reminded_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_sm']).format('date').title('Last Reminded').setTemplate 'last-reminded-at'

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

          resource.column('last_reminded_by_name').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_sm']).title 'Reminded By'


          # if !isFreeManager
          #   resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
          #     placeholder: 'Search Type'
          #   })
          resource.column('sentAction').disableColumnMenu().disableGrouping().title('Action').setWidth(grid_widths_map['sm_column_xxl']).setTemplate 'dd-sent-action'

        when 'all'
          resource.setRowTemplate("dd-project-invite-row-template")

          resource.column('investor_firm_name').showAggregationOptions(false).enableHiding(false).title(entity_user_type+' Name').setWidth(grid_widths_map['sm_column_sm']).align('left').setTemplate('dd-firm-name').filterable(true, {
            placeholder: 'Search '+entity_user_type
          })
          resource.column('entity_name').showAggregationOptions(false).enableHiding(false).title('Entity Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('dd-entity-name').filterable(true, {
            placeholder: 'Search Entity'
          })

          resource.column('tofirm_name').showAggregationOptions(false).enableHiding(false).title('To Firm').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
            placeholder: 'Search '+entity_user_type
          })

          resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Template').setWidth(grid_widths_map['sm_column_sm']).setTemplate('dd-questionnaire-name-invited').filterable(true, {
            placeholder: 'Search by Template'
          })
          resource.column('created_at').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).title('Sent Date').format 'date'

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
          resource.column('question_count').disableColumnMenu().disableGrouping().title('# of Questions').setWidth(grid_widths_map['sm_column_xxm']).format 'number'

          resource.column('d-status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_xm']).setDefaultSort('asc').setSortingAlgorithm(Utils.sortProjectsByStatus).setTemplate('dd-status-label').filterable(true, {
            placeholder: 'Search Status'
          })
          resource.column('d-type').showAggregationOptions(false).enableHiding(false).title('Type').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-type').filterable(true, {
            placeholder: 'Search Type'
          })
          resource.column('percentage_completed').disableColumnMenu().disableGrouping().title('% Complete').setWidth(grid_widths_map['sm_column_xm']).setTemplate('dd-percentage').format 'number'
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
          resource.column('statusIcon').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['icon_xs']).disableSorting().setTemplate('dd-status-icon-manager').setEmptyTitle().title ''
      resource
