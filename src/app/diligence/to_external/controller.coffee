class ToExternalController extends BaseController

    @register 'ToExternalController'

    @inject '$scope', 'Utils', 'Restangular', '$state', '$q', 'SweetAlert', 'toaster', 'WizardHandler','keywordConstants', '$filter','BaseDataService','DueDiligenceDataservice','$tinymcePlugins','$tinymceToolbar1','$tinymceToolbar2','$tinymceStatusbar','$window','$timeout','ModalFactory', 'angularEnabled'

    initialize: ->
        if !(@$state.params.diligenceId)
            @toaster.pop 'error','','Required params missing'
            @$state.go 'app.diligence.projects.activity', type: 'in-progress'

        @diligenceId = @$state.params.diligenceId
        @currentUser = @Utils.getCurrentUser()
        @email_templates = []
        @selected_entities = []
        @selected_vehicles = []
        @sender_emails = []
        @cc_emails = []
        @bcc_emails = []
        @use_email_templates = false
        @disallow_custom_edits = false
        @accept_confidential_agreement = false
        @email_text = ''
        @minDate = new Date()
        @maxAsOfDate = @Utils.getMaxAsOfDate()
        @is_data_loaded = false
        @selected_sender_email = ""
        @selected_cc_email_list = []
        @selected_bcc_email_list = []
        @showAdvanceOptions = false
        @suggested_due_date_diff = 45
        @request =
            'as_of_date': new Date()
            'due_at': null
            'contact': null

        @DueDiligenceDataservice.getDiligence(@diligenceId).then (diligence) =>
            @diligence = diligence
            @project_name = diligence.name
            promises = []

            promises.push @Restangular.one('firm_preferences').customGET().then (response) =>
                @firm_preferences = response
                @default_email_template_message_id = response.default_email_template_message_id
                if response.disallow_custom_email_template_edit
                    @disallow_custom_edits = true
                    @use_email_templates = true

                if response.customize_intro
                    @use_email_templates = true

                if response.sender_email
                    @sender_emails = response.sender_email.replace(/\s/g,'').split(",")
                    @selected_sender_email = @sender_emails[0] if @sender_emails.length > 0 and @firm_preferences.add_sender_email

                if response.cc_email
                    @cc_emails = response.cc_email.replace(/\s/g,'').split(",")
                    @selected_cc_email_list.push @cc_emails[0] if @cc_emails.length > 0 and @firm_preferences.add_cc_email

                if response.bcc_email
                    @bcc_emails = response.bcc_email.replace(/\s/g,'').split(",")
                    @selected_bcc_email_list.push @bcc_emails[0] if @bcc_emails.length > 0 and @firm_preferences.add_cc_email

            promises.push @Restangular.one('EmailTemplateMessages').customGET().then (response) =>
                @email_templates = response

            promises.push @Restangular.all('contacts').getList(entity_id: @diligence.entity_id, entity_type: @diligence.entity_type).then (response) =>
                @related_contacts = response
                @request.contact = _(@related_contacts).pluck('id')

            @$q.all(promises).then (=>

                if @default_email_template_message_id and @use_email_templates
                    @renderEmailTemplate(@default_email_template_message_id)
                )

            @is_data_loaded = true

        @tinymceOptions =
            skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
            browser_spellcheck: true
            height: 250
            plugins: @$tinymcePlugins
            custom_undo_redo_levels: 10
            toolbar1: @$tinymceToolbar1
            toolbar2: @$tinymceToolbar2
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

    getDefaultEmailTemplate: (use_email_template) =>
        if use_email_template
            @renderEmailTemplate(@default_email_template_message_id)
        else
            @email_text = ""

    setSuggestedDueDate: ->
        @request.due_at = @getSuggestedDueDate()

    renderEmailTemplate: (id) ->
        template = _(@email_templates).findWhere({id: id})
        if template
            @email_text = template.content
        else
            @email_text =  ""

    getSuggestedDueDate: (purpose) ->
        moment().add(@suggested_due_date_diff, 'days').toDate()

    gotoPreviousPage: =>
        @$window.history.back()

    generatePageUrl: =>
        pageUrl = "app/diligence/"
        if @diligence.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase() && !@diligence.linked_duediligence_id
            pageUrl += @diligence.fromfirm_id+ '/firms/'+ @diligence.tofirm_id + '/funds/' + @diligence.entity_id
        if @diligence.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
            pageUrl += @diligence.fromfirm_id+ '/firms/'+ @diligence.tofirm_id + '/strategies/' + @diligence.entity_id
        else if @diligence.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
            pageUrl += @diligence.fromfirm_id+ '/firms/'+ @diligence.tofirm_id
        else if @diligence.entity_type.toLowerCase() == @keywordConstants.Vehicle.toLowerCase()
            pageUrl += @diligence.fromfirm_id+ '/firms/'+ @diligence.tofirm_id + '/funds/' + @diligence.parent_entity_id + '/vehicles/' + @diligence.entity_id
        else if @diligence.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase() && @diligence.linked_duediligence_id
            pageUrl += @diligence.fromfirm_id+ '/firms/'+ @diligence.tofirm_id + '/strategies/' + @diligence.parent_entity_id + '/funds/' + @diligence.entity_id
        pageUrl

    sendDueDiligenceRequest: =>
        return unless @project_name_form.$valid

        unless @accept_confidential_agreement
            @SweetAlert.error
                'title': 'Confidentiality Agreement'
                'text': 'Please agree with the binding conditions by clicking the checkbox before you can send this request'
            return
        pageUrl = @generatePageUrl()
        params = {
            notification_contacts: @request.contact
            id: @diligenceId
            name: @project_name
            as_of_date: @$filter('date')(@request.as_of_date, 'MM-dd-yyyy')
            due_at: @$filter('date')(@request.due_at, 'MM-dd-yyyy')
            email_text: @email_text
            from_email: @selected_sender_email
            cc_emails: @selected_cc_email_list.join(',')
            bcc_emails: @selected_bcc_email_list.join(',')
        }

        @Restangular.one('diligences',@diligenceId).all('mark_as_external').customPUT(params,null,null,{'page-url': pageUrl}).then (response)=>
            @toaster.pop 'success', 'New request has been successfully added', '', 3000
            @$state.go 'app.diligence.projects.activity', type: 'sent'
        , (error) =>
            avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
            if !(error.status in avoid_error_logging_statuses)
                delete error.config.data.email_text
                @Utils.logError('Internal to external failed', error)
