angular.module('diligenceVault').factory 'CustomGridRenderer', (Utils) ->

    new class CustomGridRenderer

        customDropdownRenderer : (instance, td, row, col, prop, value, cellProperties)->
            optionsList = cellProperties.chosenOptions.data

            if(typeof optionsList == "undefined" || typeof optionsList.length == "undefined" || !optionsList.length)
                Handsontable.cellTypes.text.renderer(instance, td, row, col, prop, value, cellProperties)
                return td

            values = (value + "").split(",")
            value = []
            _(optionsList).each (option)=>
                if (values.indexOf(option.id + "") > -1)
                    selectedId = option.id
                    value.push(option.label)
        
            value = value.join(", ")

            Handsontable.cellTypes.text.renderer(instance, td, row, col, prop, value, cellProperties)
            return td
    
        customPercentageRenderer : (instance, td, row, col, prop, value, cellProperties)->
            Handsontable.renderers.NumericRenderer.apply(this, arguments)
            if value
                td.title = cellProperties.comment if cellProperties.comment
                td.innerHTML = value + '%'
            return td

        customNumericRenderer : (instance, td, row, col, prop, value, cellProperties)->
            Handsontable.renderers.NumericRenderer.apply(this, arguments)
            if value
                td.title = cellProperties.comment if cellProperties.comment
                td.innerHTML = numberWithCommas(value)
            return td

        customTextRenderer : (instance, td, row, col, prop, value, cellProperties)->
            Handsontable.renderers.TextRenderer.apply(this, arguments)
            if value
                td.title = cellProperties.comment if cellProperties.comment
                td.innerHTML = value
            return td

        customFormulaRenderer : (instance, td, row, col, prop, value, cellProperties)->
            Handsontable.renderers.TextRenderer.apply(this, arguments)
            sourceData = instance.getSourceDataAtCell(row, col)
            if sourceData != null and sourceData != undefined and value? and (!value.toString().startsWith('#') or (value.toString() == '#VALUE!' or value.toString() == '#DIV/0!' or value.toString() == '#N/A'))
                td.innerHTML = sourceData
            return td

        customNumericValidator: (query, callback)->
            if (query and query != "" and !Utils.numberIsDecimal(query))
                callback(false)
            else
                callback(true)

        numberWithCommas = (x) ->
            x.toString().replace /\B(?=(\d{3})+(?!\d))/g, ','
            
        MultiSelectRenderer: (instance,td,row,col,prop,value,cellProperties)->
            _cellProperties$selec = cellProperties.select
            _cellProperties$selec2 = _cellProperties$selec.config
            config = if _cellProperties$selec2 == undefined then {} else _cellProperties$selec2
            availableOptions = _cellProperties$selec.options
            _config$separator = config.separator
            separator = if _config$separator == undefined then defaultSeparator else _config$separator
            TextCellType = Handsontable.cellTypes.text;
            if typeof availableOptions == 'undefined' or typeof availableOptions.length == 'undefined' or !availableOptions.length
                TextCellType.renderer instance, td, row, col, prop, value, cellProperties
                return td
            stringValue = if value then ''.concat(value) else ''
            valueArray = stringValue.split(separator)
            formattedValue = valueArray.join(separator)
            TextCellType.renderer instance, td, row, col, prop, formattedValue, cellProperties
            td
