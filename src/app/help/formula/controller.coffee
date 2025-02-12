class FormulaHelpController extends BaseController

    @register 'FormulaHelpController'

    @inject '$stateParams', 'Restangular', '$state', 'Utils', '$scope', '$q'

    initialize: ->