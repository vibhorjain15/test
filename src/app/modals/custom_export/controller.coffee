class CustomExportController extends ModalController
    @register 'CustomExportController'

    @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout', 'diligence'

    initialize: ->
        @request = {
            template_id: null
            name: @diligence.template_name
        }
        @getTemplates()

    getTemplates: =>
        @loading_templates = true
        @Restangular.all('reports/new/mappings').one('template',@diligence.template_id).getList().then (response)=>
            @templates = response
            @request.template_id = @templates[0]['id'] if @templates.length > 0
            @loading_templates = false
        ,(error)=>
            @loading_templates = false

    redirectToTemplateDefinitions: =>
        @$uibModalInstance.close()
        @$timeout =>
            @$state.go 'app.reports.templates.list'
    
    submit: =>
        if @custom_export_form.$valid and @templates and @templates.length > 0
            @exporting_report = true
            params = 
                document_id: @request.template_id
                name: @request.name
                as_of_date: new Date()
                diligence_ids:[@diligence.id]
                save_report: false

            @Restangular.all('reports/new/generate').post(params).then (response)=>
                @toaster.pop 'success','','Report exported successfully'
                @exporting_report = false
                @close()
            ,(error)=>
                @exporting_report = false