angular.module('diligenceVault').factory 'InvestorPitchResource', ($timeout, GridResourceService, BaseDataService, GridsDataService, $templateCache) ->

    new class InvestorPitchResource
        grid_widths_map = GridsDataService.getGridWidthsMap()

        $new: (options) ->
            resource = GridResourceService.$new(options)
            # resource.addTransformer (collection) ->
            #     _(collection).each (opportunity)=>
            #         if moment(opportunity.due_date).isValid()
            #             opportunity.due_at = moment(opportunity.due_date).format('MMM d, YYYY')
            #         opportunity.as_of_date = moment(opportunity.as_of_date).format('MMM d, YYYY')

            resource.name 'service/dvapi_service/inbound_investors'
            
            resource.enableFiltering()
            resource.usePostMethod()
            resource.setRowTemplate("dd-project-row-template")
            resource.colDefaults(
                align: 'center'
                filterable: false
            )
            resource.setGridNullLabel("Ungrouped")

            resource.column('display_name').align('left').title('Investor Firms').setWidth(grid_widths_map['sm_column_lg']).setTemplate('empty-cell').filterable(true, {
                placeholder: 'Search Investor Firm'
            })
            resource.column('last_applied_at').title('Last Applied').setWidth(grid_widths_map['sm_column_xm']).format('date')
            resource.column('opportunity_count').setWidth(grid_widths_map['sm_column_xm']).format('number').title('Number of Opportunities').align('center')
            resource.column('action').disableColumnMenu().disableGrouping().title('Action').disableSorting().setTemplate('investor-pitch-action').setWidth(grid_widths_map['sm_column_xm'])
            resource
