angular.module('diligenceVault').directive 'dvGridTable', ($compile, $timeout,Utils) ->
    template: '<spinner></spinner>'
    scope: true
    link: (scope, element, attrs) ->
        deregisterer = scope.$parent.$watch attrs.response, (response) =>
            if response?
                response.initialized.then =>
                    $timeout =>
                        scope.renderTable(response)

            deregisterer()

        scope.renderTable = (response)=>
            copy = scope.$eval attrs.copy
            grid_responses = response.attributes.grid_responses

            table = "<div class='dvTable'><table class='table table-bordered table-condensed'>"
            tableClose = "</table></div>"
            
            rowTag = "<tr>"
            rowCloseTag = "</tr>"

            #Generate table header
            if !copy
                tableHeader = rowTag
                tableHeader += "<th></th>"                              #Column at index (0,0)
                _(response.columns).each (column)=>
                    tableHeader += "<th>#{column.name}</th>"
                tableHeader += rowCloseTag
            else
                tableHeader = ""
            
            #Generate table body
            tableBody = ""
            _(response.rows).each (row, rowIndex)=>
                tableNthRow = rowTag
                if response.responseType == 'Grid'
                    rowName = row.name
                else
                    rowName = rowIndex + 1
                tableNthRow += "<td><b>#{rowName}</b></td>" if !copy       #Append row header
                _(response.columns).each (column,colIndex)=>
                    #get index of the item in the gridresponses object
                    itemIndex = (response.columns.length * rowIndex) + colIndex
                    text = if grid_responses[itemIndex].attributes.value then grid_responses[itemIndex].attributes.value else ''
                    tableNthRow += "<td>#{text}</td>"
                tableNthRow += rowCloseTag
                tableBody += tableNthRow
            table += tableHeader + tableBody
            table += tableClose

            element.html($compile(table)(scope))
    