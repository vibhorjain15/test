angular.module('diligenceVault').factory 'ViewOpportunitiesResource', ($timeout, GridResourceService, BaseDataService, GridsDataService, $templateCache, $filter) ->

    new class ViewOpportunitiesResource
        $templateCache.put('ui-grid/selectionRowHeaderButtons',
            "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><dv-checkbox data-ng-model=\"row.isSelected\" data-ng-click=\"selectButtonClick(row, $event);grid.appScope.vm.toggleButtonClick(grid,row)\"></dv-checkbox></div>"
        );


        $templateCache.put('ui-grid/selectionSelectAllButtons',
            "<div class=\"ui-grid-selection-row-header-buttons doc-checkbox\" data-ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ><dv-checkbox data-ng-model=\"grid.selection.selectAll\" data-ng-click=\"headerButtonClick($event)\"></dv-checkbox></div>"
        );
        grid_widths_map = GridsDataService.getGridWidthsMap()

        $new: (options) ->
            resource = GridResourceService.$new(options)
            resource.addTransformer (collection) ->
                _(collection).each (opportunity)=>
                    if opportunity.due_date and moment(opportunity.due_date, 'YYYY-MM-DD HH:mm:ss').isValid()
                        opportunity.due_at = $filter('date')(moment(opportunity.due_date, 'YYYY-MM-DD HH:mm:ss').toDate())
                    opportunity.as_of_date = $filter('date')(moment(opportunity.as_of_date, 'YYYY-MM-DD HH:mm:ss').toDate())
                    opportunity.contact_list = _(opportunity.contacts).pluck('name')

            resource.name 'service/dvapi_service/inbound_configuration'
            
            resource.enableFiltering()
            resource.usePostMethod()
            resource.enableRowSelection({full_row_selection: false})
            resource.setRowTemplate("dd-project-row-template")
            resource.colDefaults(
                align: 'center'
                filterable: false
            )
            resource.setGridNullLabel("Ungrouped")

            resource.column('name').disableColumnMenu().disableGrouping().title('Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
                placeholder: 'Search by name'
            })
            resource.column('redirect_url').disableColumnMenu().disableGrouping().disableSorting().title('Links').setWidth(grid_widths_map['sm_column_xm']).setTemplate('inbound-links')
            resource.column('submission_count').disableSorting().setWidth(grid_widths_map['sm_column_sm']).disableGrouping().disableColumnMenu().title('Submissions').align('center').setTemplate('inbound-submissions')
            resource.column('contact_list').disableColumnMenu().disableGrouping().title('Contacts').setWidth(grid_widths_map['sm_column_xl']).setTemplate('dd-inbound-contacts')

            resource.column('template_name').align('left').disableColumnMenu().disableGrouping().title('Template Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
                placeholder: 'Search Template'
            })
            resource.column('visibility_type_name').disableColumnMenu().disableGrouping().title('Visibility').setWidth(grid_widths_map['sm_column_xm']).setTemplate 'inbound-visibility-type'
            resource.column('email_template_name').disableGrouping().showAggregationOptions(false).enableHiding(false).title('Email Template').align('center').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
                placeholder: 'Search Email Template'
            })
            resource.column('due_date').setDefaultSort('desc').disableColumnMenu().disableGrouping().title('Expiry Date').setWidth(grid_widths_map['sm_column_sm']).format('date').setTemplate 'inbound-due-date'
            resource.column('as_of_date').disableColumnMenu().disableGrouping().title('Created Date').setWidth(grid_widths_map['sm_column_sm']).format('date')
            
            resource.column('action').disableColumnMenu().disableGrouping().title('Action').disableSorting().setTemplate('inbound-action').setWidth(grid_widths_map['sm_column_xm'])
            resource
