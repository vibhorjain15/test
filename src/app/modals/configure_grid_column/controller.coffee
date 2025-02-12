class ConfigureGridColumnController extends ModalController

    @register 'ConfigureGridColumnController'

    @inject 'type_options','Restangular', '$scope', '$timeout','Utils'

    initialize: ->
        @selectOptions = []
        @newOptions = []
        @enable_multiselection = false

        @Restangular.all('column_types').getList().then (response)=>
            @columnTypes = response

        @supportedFormats = ['MM-DD-YYYY','YYYY-MM-DD', 'DD-MM-YYYY']

        if @type_options.enable_multiselection
            @enable_multiselection = true

        if @type_options.dateFormat
            @dateFormat = @type_options.dateFormat

        if @type_options.source and @type_options.source.length > 0
            _(@type_options.source).each (option)=>
                @selectOptions.push {text: option}
            @$timeout =>
                if @selectOptions.length > 0
                  @$scope.$broadcast 'changed:responseType' , @selectOptions


    finishBulkOptionSubmit: ->
      @useSingleOptionsMode = true

    submit: =>
        return if @grid_column_config_form.$invalid
        if @type_options.type == "dropdown"
            @type_options.source = []
            _(@selectOptions).each (option)=>
                #insert the dropdown item directly into the list without encoding, because now encoding is done while 
                #displaying the grid
                @type_options.source.push option.text
            if @enable_multiselection
                @type_options.enable_multiselection = true
            else
                @type_options.enable_multiselection = false
        else if @type_options.type == "date"
            @type_options.dateFormat = @dateFormat
        @close(@type_options)
