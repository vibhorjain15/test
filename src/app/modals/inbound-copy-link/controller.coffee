class InboundCopyLinkController extends ModalController
    @register 'InboundCopyLinkController'

    @inject '$stateParams','link'

    initialize: ->
        @copied = false

    copyToClipboard: =>
        navigator.clipboard.writeText(this.link);
        @copied = true