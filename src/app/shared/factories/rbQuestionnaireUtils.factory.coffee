angular.module('diligenceVault').factory 'rbQuestionnaireUtils', () ->

  new class rbQuestionnaireUtils

    selectChildren: (node, selectStatus) ->
      node.isSelected = selectStatus

      if node.subSections
        _(node.subSections).each (child) ->
          child.isSelected = selectStatus

          if child.questions
            _(child.questions).each (question) ->
              question.isSelected = selectStatus

      if node.questions
        _(node.questions).each (child) ->
          child.isSelected = selectStatus

    selectParentSection: (parentNode) ->
      if parentNode.subSections
        selectedSubSections = _(parentNode.subSections).filter (subSection) -> subSection.isSelected
        parentNode.isSelected = parentNode.subSections.length == selectedSubSections.length

    selectParentSubSection: (parentNode) ->
      if parentNode.questions
        selectedQuestions = _(parentNode.questions).filter (question) -> question.isSelected
        parentNode.isSelected = parentNode.questions.length == selectedQuestions.length

    findParentSection: (tree, subSectionNode) ->
      sectionId = subSectionNode.attributes.parentID
      parentSection = []

      if tree.length
        _(tree).each (section) ->
          if section.id == sectionId
            parentSection.push section

      parentSection[0]

    findParentSubSection: (tree, currentNode) ->
      parentId = currentNode.attributes.sectionID
      parentNode = []

      if tree.length
        _(tree).each (section) ->
          _(section.subSections).each (subSection) ->
            if subSection.id == parentId
              parentNode.push subSection

      parentNode[0]

    findParentSectionFromQuestion: (tree, questionNode) ->
      parentId = questionNode.attributes.sectionID
      parentNode = []

      if tree.length
        _(tree).each (section) ->
            if section.id == parentId
              parentNode.push section

      parentNode[0]

    getSelectedNodes: (tree) ->
      selectedNodes = []

      if tree.length
        _(tree).each (section) ->
          if section.isSelected
            selectedNodes.push section
          else
            if section.questions?
              _(section.questions).each (question) ->
                if question.isSelected
                  selectedNodes.push question
            else
              _(section.subSections).each (subSection) ->
                if subSection.isSelected
                  selectedNodes.push subSection
                else
                  _(subSection.questions).each (question) ->
                    if question.isSelected
                      selectedNodes.push question

      selectedNodes

    setSelectedNodes: (tree, selectedNodes) ->

      if tree.length
        _(tree).each (section) ->
          _(selectedNodes).each (selectedNode) ->
            if selectedNode.id == section.id and selectedNode.type == 'sections'
              section.isSelected = true
              _(section.subSections).each (subSection) ->
                subSection.isSelected = true
                _(subSection.questions).each (question) ->
                  question.isSelected = true

              _(section.questions).each (question) ->
                question.isSelected = true

          _(section.subSections).each (subSection) ->
            _(selectedNodes).each (selectedNode) ->
              if selectedNode.id == subSection.id and selectedNode.type == 'sections'
                subSection.isSelected = true
                _(subSection.questions).each (question) ->
                  question.isSelected = true

            _(subSection.questions).each (question) ->
              _(selectedNodes).each (selectedNode) ->
                if selectedNode.id == question.id and selectedNode.type == 'questions'
                  question.isSelected = true

          _(section.questions).each (question) ->
            _(selectedNodes).each (selectedNode) ->
              if selectedNode.id == question.id and selectedNode.type == 'questions'
                question.isSelected = true

    showSelectedTree: (tree) ->
      treeCopy = angular.copy tree
      selectedNodesList = []

      if treeCopy.length
        _(treeCopy).each (section) ->
          _(section.subSections).each (subSection) ->
            _(subSection.questions).each (question) ->
              if question.isSelected
                selectedNodesList.push question.id
                selectedNodesList.push subSection.id
                selectedNodesList.push section.id

          _(section.questions).each (question) ->
            if question.isSelected
              selectedNodesList.push question.id
              selectedNodesList.push section.id

      uniqueNodes = _.uniq(selectedNodesList)
      uniqueNodes = _(uniqueNodes).sortBy (node) -> node

      uniqueNodes

    toggleEntireTree: (tree, selectionValue) ->
      if tree.length
        _(tree).each (section) =>
          @selectChildren(section, selectionValue)