class FirmSettingsFirmTagsController extends BaseController
    @register 'FirmSettingsFirmTagsController'

    @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex', 'ModalFactory','angularEnabled'

    initialize: ->
