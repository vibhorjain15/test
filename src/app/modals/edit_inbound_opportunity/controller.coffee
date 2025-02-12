class EditInboundOpportunityController extends ModalController
    @register 'EditInboundOpportunityController'

    @inject '$stateParams', 'Restangular', 'inbound', '$q', 'TemplatesDataService', 'BaseDataService', '$tinymcePlugins','$tinymceStatusbar', '$tinymceToolbarFull', 'ModalFactory','toaster','Utils','$timeout','keywordConstants'

    initialize: ->
        @minDate = new Date()
        @params = angular.copy @inbound
        @params.contacts = _(@params.contacts).pluck('id')
        @params.email_template_id = @params.email_template
        @params.due_date = if @params.due_date then moment(@params.due_date).toDate() else null
        promises = []
        promises.push @fetchEmployees()
        promises.push @getTemplates()
        promises.push @Restangular.all('EmailTemplateMessages').getList()
        promises.push @Restangular.all('Inbound_configuration_visibility_types').getList()

        @$q.all(promises).then (response)=>
            @emailTemplates = response[2]
            @visibilities = response[3]

        @tinymceOptions =
            skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
            browser_spellcheck: true
            height: 250
            plugins: @$tinymcePlugins
            custom_undo_redo_levels: 10
            toolbar: 'bold italic underline alignleft aligncenter alignright alignjustify superscript forecolor backcolor link dv_img_selector bullist numlist hr undo redo fullscreen'
            toolbar_mode: 'wrap'
            menubar: false
            statusbar: @$tinymceStatusbar
            branding: false
            resize: false
            elementpath: false
            image_dimensions: false
            forced_root_block : ""
            content_css : 'assets/stylesheets/tiny_mce_custom.css'
            table_toolbar: ""
            render: (editor) =>
                @$timeout => #since this comes from a event handler in tinymce
                    @ModalFactory.invokeModal 'questionnaire_upload_image',
                        resolve:
                            editor: -> editor

    fetchEmployees: =>
        @BaseDataService.getTeamMembers().then (response) =>
            @team_members = _(response).map (teamMember) =>
                teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
                teamMember

    getTemplates: =>
        @TemplatesDataService.getTemplates(detail: false).then (response) =>
            @templates = response

    submit: =>
        if @edit_inbound_opportunity_form.$valid
            @saving_opportunity = true
            params = _(@params).pick('name','template_id','email_template_id','entity_type','contacts','due_date','description','visibility_type')
            params.type = 'edit'
            params.config_id = @params.id
            params.due_date = @Utils.formatDatetime(params.due_date) if params.due_date
            @Restangular.all('service/dvapi_service/inbound_configuration').post(params).then (response)=>
                @saving_opportunity = false
                @toaster.pop 'success','','Successfully Updated the link with new edits'
                @close response
            , (error)=>
                @saving_opportunity = false
                @toaster.pop 'error','','Failed to update opportunity'