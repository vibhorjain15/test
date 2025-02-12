class FirmSettingsProjectTagsController extends BaseController
    @register 'FirmSettingsProjectTagsController'

    @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex', 'ModalFactory','angularEnabled'

    initialize: ->
