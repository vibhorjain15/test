class FirmSettingsVehicleTagsController extends BaseController
    @register 'FirmSettingsVehicleTagsController'

    @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex', 'ModalFactory','angularEnabled'

    initialize: ->
