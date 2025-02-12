class ManageExcelSheetsController extends ModalController

  @register 'ManageExcelSheetsController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', 'Utils', 'TemplatesDataService', '$state', '$timeout', '$scope', 'ModalFactory', 'sheets', 'disabledMode', 'active_sheet_no'

  initialize: ->
    # initialize empty params
    @activeTab = "Question"
    @disableOtherSheets = false
    if @disabledMode
      @disableOtherSheets = true

    @sheetsData = []
    if @sheets and @sheets.length
      @sheetsData = angular.copy @sheets

  save: =>
    @loading = true
    @TemplatesDataService.setSelectedSheets(@sheetsData)
    @close(@sheetsData, @disableOtherSheets)
