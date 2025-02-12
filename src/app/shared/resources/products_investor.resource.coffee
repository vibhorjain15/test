angular.module('diligenceVault').factory 'ProductsInvestor', (GridResourceService, GridsDataService) ->
  new class ProductsInvestor

    grid_widths_map = GridsDataService.getGridWidthsMap()
    row_height = 100

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) ->
         angular.forEach collection, (fund) ->
           if fund.toContactEmail?
             fund.toContactEmailStr = fund.toContactEmail.join(', ')

      resource.name 'funds',

      resource.colDefaults align: 'center'
      resource.column('parentFirm.name').title('Parent Firm').setDefaultSort('asc').align('left')
      resource.column('name').setWidth(grid_widths_map['sm_column_xm']).title('Fund Name').align('left')
      resource.column('projectCount').title('Invited / Live Count')
      resource.column('toContactEmail').title('Fund Contacts').setWidth(grid_widths_map['sm_column_xxl']).setTemplate('manage-products-fund-contacts').setHeight(row_height)
      resource.column('action').title('Action').disableSorting().setTemplate('fund-action')

      resource
