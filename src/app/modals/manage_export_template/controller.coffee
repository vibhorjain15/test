class ManageExportTemplateController extends ModalController
    @register 'ManageExportTemplateController'

    @inject 'Restangular', 'Utils', 'toaster','FileHandlerFactory','$scope','template','FirmPreferenceDataService','template_list'

    initialize: ->
        @maxFileSize = @FileHandlerFactory.getMaxFileSize()

        if @template
            @edit_mode = true
        else
            @edit_mode = false
            @template = {}
            
        @$scope.$watch 'vm.files', (value) =>
            if value and value.length > 0 and not @template.name
                @template.name = value[0].name

    submit: =>
        unless @isUniqueTemplateName(@template)
            @toaster.pop 'error','','Template with the same name already exists'
            return

        if @manage_export_template.$valid
            if @edit_mode
                @saving_template = true
                params = {
                    name: @template.name
                }
                @FirmPreferenceDataService.updateAttachment(@files, params, @template.id).then ((response) =>
                    @saving_template = false
                    @toaster.pop 'success', '', 'Template successfully updated'
                    @close response.data
                ), ((error) =>
                    @saving_template = false
                )
            else
                unless @files?.length
                    @toaster.pop 'error', '', 'Please select a file'
                    return
                
                @saving_template = true
                @documentParams = {
                    name: @template.name
                }
                @uploadDocument()

    documentUploadComplete: (response)=>
        @close response[0]
        @saving_template = false

    documentUploadFailed: (response)=>
        @saving_template = false

    uploadDocument: =>
        file_handler1 = @FileHandlerFactory.get('file-handler-one')
        file_handler2 = @FileHandlerFactory.get('file-handler-two')
        selected_file_handler = {}

        _([file_handler1, file_handler2]).each (handler) =>
            if(handler != undefined && handler.files != undefined && handler.files.length > 0 && (handler.files[0].name == @files[0].name))
                selected_file_handler = handler
        selected_file_handler.upload()

    downloadTemplate: =>
        @Restangular.one('DocumentExportTemplates', @template.id).one('signed_url', null).get().then (response)=>
            url = response
            $link = $("<a href=\"#{url}\" target='_blank' class='hidden'></a>")
            $('body').append($link)
            $link[0].click()
            $link.remove()

    isUniqueTemplateName: (new_template) =>
        status = @template_list.filter((template) => template.id != new_template.id and template.name == new_template.name).length == 0
        status