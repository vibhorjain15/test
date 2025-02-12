class FieldSelectionController extends BaseController
    @register 'FieldSelectionController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$q','$http','$tinymcePlugins','$tinymceStatusbar','$tinymceToolbar1'

    initialize: ->
        @current_user = @Utils.getCurrentUser()
        @currentFirmId = @current_user.firmInfo.id
        @loading_data = true
        @redirectionUrl = "app.firm.settings."+@customUrl
        @toolbar2 = 'table | bullist numlist | hr | undo redo | link | dv_fullscreen'
        @$scope.$watch 'vm.fields', (value)=>
            if value
                if @splitMandatory
                    @mandatoryFields = []
                    _(value).each (field)=>
                        field = @parseField(field)
                        @mandatoryFields.push field if field.is_mandatory
                    @nonmandatoryFields = []
                    _(value).each (field)=>
                        field = @parseField(field)
                        @nonmandatoryFields.push field if !field.is_mandatory
                    if @mandatoryFields.length == 0
                        for index in [0...3]
                            if @nonmandatoryFields[0]
                                @mandatoryFields.push @nonmandatoryFields[0]
                                @nonmandatoryFields.splice(0,1)
                else
                    @mandatoryFields = []
                    _(value).each (field)=>
                        field = @parseField(field)
                        @mandatoryFields.push field

                @setTrackingInTinymce()
                @tinymceOptions = @tinymceOptionsMain
                @loading_data = false

        @tinymceOptionsMain =
            skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
            browser_spellcheck: true
            height: 180
            plugins: @$tinymcePlugins
            custom_undo_redo_levels: 10
            toolbar1: @$tinymceToolbar1
            toolbar2: @toolbar2
            menubar: false
            statusbar: @$tinymceStatusbar
            branding: false
            resize: false
            elementpath: false
            image_dimensions: false
            contextmenu: false
            forced_root_block : ""
            content_css : 'assets/stylesheets/tiny_mce_custom.css'
            table_toolbar: ""
            init_instance_callback: (editor)=>
                editor.on(FLITE.Events.TRACKING, (flite, tracking)=>
                    @tinymceOptions.flite.isTracking = flite.tracking
                )
            setup: (ed) =>
                @editor = ed
                # ed.on('KeyDown', (event,ed)=>
                #     if @response.question.attributes.responseType == "TextMultiLine"
                #         if event.keyCode != 8 && event.keyCode != 13 && event.keyCode != 46 && @response.question.attributes.response_word_limit != null && tinymce.activeEditor.plugins.wordcount.getCount() > @response.question.attributes.response_word_limit
                #             tinymce.dom.Event.cancel(event);
                # )
                ed.on(FLITE.Events.INIT, (event)=>
                    @flite = event.flite
                )

    setTrackingInTinymce: =>
        if @enableTracking
            @tinymceOptionsMain.plugins = @$tinymcePlugins + ' flite'
            @tinymceOptionsMain.toolbar2 = @toolbar2 + " | flite"
            @tinymceOptionsMain.flite = {
                preserveWhiteSpace: false
                isTracking: if @enableTracking then true else false
                isVisible: true
                userName: @current_user.fullName
                userId: @current_user.id
                commands: [FLITE.Commands.TOGGLE_TRACKING, FLITE.Commands.ACCEPT_ALL, FLITE.Commands.REJECT_ALL, FLITE.Commands.ACCEPT_ONE, FLITE.Commands.REJECT_ONE]
            }

    parseField: (field)=>
        if field.type == 'dropdown'
            field.otherOption = _(field.options).find (option) ->
                option.value.toLowerCase() is 'other'

            if field.value and field.value.length > 0
                if field.otherOption and field.value[0].id == field.otherOption.id
                    field.textExplanation = field.value[0].explanation

                if field.value[0].id
                    field.value = _(field.options).find (option)=>
                        option.id == field.value[0].id
                else
                    field.value = _(field.value[0]).pick('id','value')
        else if field.type == 'checkbox'
            field.otherOption = _(field.options).find (option) ->
                option.value.toLowerCase() is 'other'

            if field.value and field.value.length == 1 and !field.value[0].id
                field.value = []

            if field.otherOption
                otherOptionIndex = _(field.value).findIndex((item)=>
                    field.otherOption.id == item.id
                )
                if otherOptionIndex > -1
                    field.textExplanation = field.value[otherOptionIndex].explanation
                    field.value[otherOptionIndex] = _(field.options).findWhere(id: field.otherOption.id)
        else if field.type == 'dynamic'
            if field.method.toLowerCase() == 'get'
                requestPromise = @$http.get(field.endpoint, field.request_params)
            else if field.method.toLowerCase() == 'post'
                requestPromise = @$http.post(field.endpoint, field.request_params)
            requestPromise.then (response) =>
                if field.method.toLowerCase() == 'get'
                    responseData = response.data
                else if field.method.toLowerCase() == 'post'
                    responseData = response.data.data
                field.dynamicSource = []
                if field.value and field.value.length > 0
                    fieldIds = _(field.value).pluck('id')

                    field.value = []
                _(responseData).each (source)=>
                    newField =
                        value: source[field.display_attribute]
                        id: source.id
                    field.dynamicSource.push newField
                    if fieldIds and source.id in fieldIds
                        field.value.push newField
                if !field.has_multiple and field.value and field.value.length > 0
                    field.value = field.value[0]

        else if (field.type == 'int' or field.type == 'numeric' or field.type == 'text') and !field.has_multiple
            if field.value.length > 0
                value = field.value[0]
                field.value = [value]

        @onResponseChange(field)
        field

    addNewField: (field)=>
        field.value.push {
            value: ""
        }

    removeField: (field, index)=>
        if index > 0
            field.value.splice(index,1)
        else
            keys = Object.keys(field.value[index])
            _(keys).each (key)=>
                field.value[index][key] = ""

    onResponseChange: (field)=>
        switch field.type
            when 'checkbox'
                field.is_other_option_selected = field.otherOption and _(field.value).findIndex((item)=>
                    field.otherOption.id == item.id
                ) > -1

    setValidationMessage: =>
        _(@fieldselectionForm.$$controls).each((formItem)=>
            if formItem.$name and formItem.$name.indexOf('team') > -1 and formItem.$modelValue
                map = _(@selectedFields).filter((team)=>
                    team.team == formItem.$modelValue
                )
                occurence = map.length
                formItem.$setValidity('duplicateTeam', occurence < 2)
        )


    initFields: (field)=>
        field.value = [{
            value: ""
        }]
