class ExcelSyncListController extends BaseController
  @register 'ExcelSyncListController'

  @inject 'Restangular', 'Utils', '$stateParams', '$scope', 'toaster', 'ExcelSyncResource', 'angularEnabled'

  initialize: ->
    @sync_list = @ExcelSyncResource.$new()
    allowed_file_extensions = ['xls', 'xlsm', 'xlsx']
    @maxFileSize = '50MB'

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

  excelUploadComplete: () =>
    @toaster.pop 'success', '', 'File uploaded successfully'
    @files = []
    @sync_list.refresh()

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()
