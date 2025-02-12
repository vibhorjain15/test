import  {ParserElementType, ParserSelectionType}  from  './parser.constant'
export class WordParser
{
    word_div: any;
    hasMergedTables: boolean;
    text_parent_tags: string[];
    text_child_tags: string[];
    table_parent_tags: string[];
    text_tags: any;
    all_tags: any;
    missing_ans_cell_attr: string;
    constructor(id)
    {
        this.word_div = id;
        this.hasMergedTables = false;

        this.text_parent_tags = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
        this.text_child_tags = ['SPAN'];
        this.table_parent_tags = ['TD'];

        this.text_tags = this.text_parent_tags.concat(this.text_child_tags);
        this.all_tags = this.text_tags.concat(this.table_parent_tags);

        this.missing_ans_cell_attr = 'missing_answer_cell';
    }
    getTagStyle(tag) {
        let style = getComputedStyle(tag);
        let tag_style:any = style['color'] + style['fontFamily'] + style['fontSize'] + style['backgroundColor'] + style['fontWeight'];
        tag_style = tag_style.replaceAll('"', '');
        tag_style = tag_style.replaceAll('\'', '');
        return tag_style;
    }

    getTagParent(tag, parent_tag_name = null) {

        if (parent_tag_name == null) {
            while (tag && !this.text_parent_tags.includes(tag.tagName)) {
                tag = tag.parentElement;
            }
        } else {
            while (tag && tag.tagName != parent_tag_name) {
                tag = tag.parentElement;
            }
        }
        return tag;
    }

    getTagText(tag) {
        let text = tag.innerText;
        if (tag.tagName === 'LI') {
            let _o_nested_lists = tag.querySelectorAll(':scope > ol');
            let _u_nested_lists = tag.querySelectorAll(':scope > ul');
            
           
            for (let node of _o_nested_lists) {
                let node_text = node.innerText;
                text = text.replace(node_text, '');
            }

            for (let node of _u_nested_lists) {
                let node_text = node.innerText;
                text = text.replace(node_text, '');
            }
        }
        return text.trim().replace(/\s\s+/g, ' ');
    }

    tableHasMergedCells(table) {
        let merged_row_cells = table.querySelectorAll('[rowspan]');
        let merged_column_cells = table.querySelectorAll('[colspan]');

        for (let col of merged_column_cells) {
            if (col.colSpan > 1) {
                return true;
            }
        }

        for (let row of merged_row_cells) {
            if (row.rowSpan > 1) {
                return true;
            }
        }
        return false;
    }

    isTagInsideTable(element) {
        while (element && element.tagName != 'TABLE') {
            element = element.parentElement;
        }

        if (element && element.tagName == 'TABLE') {
            return true;
        }
        return false;
    }

    setStyleAttribute() {
        
        let set_style_promise = new Promise((resolve, reject) => {
            let elements:any = document.getElementById(this.word_div).querySelectorAll(this.all_tags.join(', '));
        let anchorTags:any = document.getElementsByTagName('a');
        // for (let elem of anchorTags)
        // {
        //     elem.style = 'text-decoration:none';
        // }
        // Array.from(anchorTags).map((anchorTag: any) =>
        // anchorTag.setStyleAttribute('text-decoration','none'));
        // anchorTags.map((single_anchor_tag)=>{
        //     single_anchor_tag.style.textDecoration = 'none';
        // })
        
            for (let [no, elem] of elements.entries()) {
                let elem_style = this.getTagStyle(elem);
                let elem_text = this.getTagText(elem);
                elem.setAttribute('elem_style', elem_style);

                if (elem_text)
                    elem.setAttribute('elem_text', elem_text);

                elem.id = `text_${no}`;

                if (elem.tagName != 'TD' && this.isTagInsideTable(elem)) {
                    elem.setAttribute('has_td', true);
                }

                if (elem.tagName == 'TD' && !elem_text) {
                    elem.setAttribute('empty_td', true);
                }
            }

            let tables:any = document.getElementById(this.word_div).querySelectorAll('table');
            for (let [no, table] of tables.entries()) {
                table.id = `table_${no}`
                table.setAttribute('table_no', no);
                if (this.tableHasMergedCells(table)) {
                    this.hasMergedTables = true;
                    table.setAttribute('merge_cells_present', true);
                } else {
                    // table.setAttribute('merge_cells_present', false);

                    let no_of_rows = table.rows.length;
                    let no_of_cols = table.rows[0].cells.length;

                    if (no_of_rows > 1) {
                        table.setAttribute('multiple_rows', true);
                    }
                    if (no_of_cols > 1) {
                        table.setAttribute('multiple_cols', true);
                    }
                }

            }
            resolve('Success');
        });

        let res;
        set_style_promise.then(
            function (value) {
                res = value;
            },
            function (error) {
                console.error(error);
                console.error('Error while setting style attribute for tags.');
            }
        );
        return res;
    }

    setTypeAttribute(tags, child_tag, operation, elem_type = null, attr = 'elem_type') {
        // console.log('Inside setTypeAttribute', tags, child_tag, operation, elem_type, attr);
        let child_tag_name, child_tag_style;

        if (child_tag) {
            child_tag_name = child_tag.tagName;
            child_tag_style = child_tag.getAttribute('elem_style');
        }

        for (let tag of tags) {
            if (operation == ParserSelectionType.DESELECT || operation == ParserSelectionType.DESELECT_TYPE || operation == ParserSelectionType.DESELECT_ALL) {
                tag.removeAttribute(attr);
            } else if (operation == ParserSelectionType.SELECT) {
                tag.setAttribute('elem_type', elem_type);
            } else {
                let text = tag.getAttribute('elem_text');
                let element_exists = tag.querySelector(`${child_tag_name}[elem_style="${child_tag_style}"]`);
                if (element_exists && text) {
                    if (operation == ParserSelectionType.SELECT_SIMILAR) {
                        tag.setAttribute('elem_type', elem_type);
                    } else if (operation == ParserSelectionType.DESELECT_SIMILAR) {
                        tag.removeAttribute('elem_type')
                    }
                }
            }
        }
    }

    markOrUnmarkTextTags(tag, operation, elem_type) {
        // console.log('inside markOrUnmarkTextTags', tag, operation, elem_type)
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            let parent_tag = this.getTagParent(tag);
            if (!parent_tag) {
                reject(`couldn't find the parent tag for this tag: ${tag.tagName}`);
            }

            let parent_tag_name = parent_tag.tagName;
            let selector = '';
            let tags:any = [];

            if (operation == ParserSelectionType.SELECT || operation == ParserSelectionType.DESELECT) {
                tags = [parent_tag];
            } else {
                if (operation == ParserSelectionType.SELECT_SIMILAR)
                    selector = `${parent_tag_name}`;
                else if (operation == ParserSelectionType.DESELECT_SIMILAR)
                    selector = `${parent_tag_name}[elem_type]`;
                else if (operation == ParserSelectionType.DESELECT_TYPE)
                    selector = `[elem_type="${elem_type}"]`;
                else if (operation == ParserSelectionType.DESELECT_ALL)
                    selector = '[elem_type]';

                selector += ':not([has_td])';
                tags = document.getElementById(this.word_div).querySelectorAll(selector);
            }
            this.setTypeAttribute(tags, tag, operation, elem_type);
            resolve('Success');
        });

        let res;
        mark_or_unmark_promise.then(
            function (value) {
                res = value;
            },
            function (error) {
                console.error(error);
                console.error('Error while marking or unmarking text tags.');
            }

        );
        return res;
    }

    markOrUnmarkTableTags(tag, operation, elem_type) {
        // console.log('Inside markOrUnmarkTableTags', tag, operation, elem_type);
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            let table;
            if (elem_type != ParserElementType.ANSWER || operation == ParserSelectionType.SELECT || operation == ParserSelectionType.DESELECT) {
                let tags = [];
                let td_tag = this.getTagParent(tag, 'TD');
                table = this.getTagParent(td_tag, 'TABLE');
                let td_tag_type = td_tag.getAttribute('elem_type');
                let column_no = td_tag.cellIndex + 1;
                let selector = '';

                if (operation == ParserSelectionType.SELECT || operation == ParserSelectionType.DESELECT) {
                    tags = [td_tag];
                } else {
                    if (operation == ParserSelectionType.SELECT_SIMILAR)
                        selector = `td:nth-child(${column_no}):not([empty_td])`;
                    else if (operation == ParserSelectionType.DESELECT_SIMILAR) {
                        if (td_tag_type == ParserElementType.ANSWER) {
                            selector = `td:nth-child(${column_no})[elem_type="${ParserElementType.ANSWER}"]`;
                            operation = ParserSelectionType.DESELECT;
                        }
                        else {
                            selector = `td:nth-child(${column_no})[elem_type]:not([empty_td])`;
                        }
                    }
                    else if (operation == ParserSelectionType.DESELECT_TYPE)
                        selector = `[elem_type="${elem_type}"]`;
                    else if (operation == ParserSelectionType.DESELECT_ALL)
                        selector = '[elem_type]';

                    tags = table.querySelectorAll(selector);
                }
                this.setTypeAttribute(tags, tag, operation, elem_type);
            } else if (elem_type == ParserElementType.ANSWER) {
                let td_tag = this.getTagParent(tag, 'TD');
                table = this.getTagParent(td_tag, 'TABLE');
                let column_no = td_tag.cellIndex;
                // console.log('column_no', column_no);

                let tr_tags = table.querySelectorAll('tr');

                // if (operation == ParserSelectionType.DESELECT_SIMILAR) {
                //     let answer_cells = table.querySelectorAll(`td:nth-child(${column_no + 1})[elem_type="${ParserElementType.ANSWER}"]`);
                //     this.setTypeAttribute(answer_cells, null, ParserElementType.DESELECT);
                // }


                for (let [ind, tr_tag] of tr_tags.entries()) {
                    let answer_cell = tr_tag.querySelector(`td:nth-child(${column_no + 1})`);
                    // console.log('answer_cell', answer_cell);
                    if (!answer_cell) {
                        continue;
                    }
                    let questions_in_row = tr_tag.querySelectorAll(`[elem_type="${ParserElementType.QUESTION}"]`);
                    let no_of_questions_in_row = questions_in_row.length;

                    if (no_of_questions_in_row == 0 && ind > 0) {
                        // logic for question and answer in same column
                        let prev_tr = tr_tags[ind - 1];
                        let prev_tr_marked_items = prev_tr.querySelectorAll('[elem_type]');
                        let prev_tr_last_marked_item = prev_tr_marked_items[prev_tr_marked_items.length - 1];

                        if (prev_tr_last_marked_item && prev_tr_last_marked_item.getAttribute('elem_type') == ParserElementType.QUESTION) {
                            answer_cell.setAttribute('elem_type', ParserElementType.ANSWER);
                        }
                    } else if (no_of_questions_in_row == 1) {
                        // logic for row with single question
                        if (column_no <= questions_in_row[0].cellIndex) {
                            continue;
                        }
                        let tags = tr_tag.querySelectorAll(`[elem_type="${ParserElementType.ANSWER}"]`);
                        this.setTypeAttribute(tags, null, ParserSelectionType.DESELECT);
                        answer_cell.setAttribute('elem_type', ParserElementType.ANSWER);

                    } else if (no_of_questions_in_row > 1) {
                        // logic for row with more than 1 question
                        let selected_elements = tr_tag.querySelectorAll('[elem_type]');
                        let question_present = false;

                        for (let elem of selected_elements) {
                            if (elem.cellIndex >= column_no)
                                break;
                            if (elem.getAttribute('elem_type') == ParserElementType.QUESTION) {
                                question_present = true;
                            } else {
                                question_present = false;
                            }
                        }
                        if (question_present) {
                            answer_cell.setAttribute('elem_type', elem_type);
                        }
                    }
                }

            }
            let has_question = table.querySelector(`[elem_type=${ParserElementType.QUESTION}]`);
            if (has_question) {
                table.setAttribute('elem_type', ParserElementType.CUSTOM_TABLE);
            } else if (table.getAttribute('elem_type' == ParserElementType.CUSTOM_TABLE)) {
                table.removeAttribute('elem_type');
            }
            resolve('Success');
        });

        let res;
        mark_or_unmark_promise.then(
            function (value) {
                res = value;
            },
            function (error) {
                console.error(error);
                console.error('Error while marking or unmarking table tags.')
            }
        );
        return res;
    }

    markOrUnmarkGrids(tag, operation, elem_type) {
        // console.log('Inside markOrUnmarkGrids', tag, operation, elem_type);
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            let table = this.getTagParent(tag, 'TABLE');

            let merge_cells_present = table.hasAttribute('merge_cells_present');

            if (merge_cells_present) {
                reject('Has merged cells');
            }

            if (operation == ParserSelectionType.SELECT && elem_type) {
                table.setAttribute('elem_type', elem_type);
            } else if (operation == ParserSelectionType.DESELECT) {
                table.removeAttribute('elem_type');
            }
            resolve('Success');
        });

        let res;
        mark_or_unmark_promise.then(
            function (value) {
                res = value;
            },
            function (error) {
                console.error(error);
                console.error('Error while marking or unmarking tables.')
            }
        )
        return res;
    }

    getMarkingsCount(){
        // console.log('Inside getMarkingsCount');
        let counts_obj = {};
        let get_markings_count = new Promise((resolve, reject) => {

            counts_obj[ParserElementType.SECTION] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.SECTION}"]`).length;
            counts_obj[ParserElementType.SUB_SECTION] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.SUB_SECTION}"]`).length;
            counts_obj[ParserElementType.QUESTION] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.QUESTION}"], [elem_type="${ParserElementType.GRID}"], [elem_type="${ParserElementType.DYNAMIC_GRID}"] `).length;
            counts_obj[ParserElementType.ANSWER] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.ANSWER}"]`).length;
            //res = counts_obj;
            resolve(counts_obj);

        });

        get_markings_count.then(
            function (value) {
                return;
            },
            function (error) {
                console.error(error);
                console.error('Error while getting marking counts');
            }
        );
        return counts_obj;
    }

    /*
    getUnmarkedTexts = function () {
        let unmarked_text_data = {};
        let get_unmarked_texts_promise = new Promise((resolve, reject) => {
            let selector = '';
            for (let parent_tag of this.text_parent_tags) {
                selector += `${parent_tag}:not([elem_type]):not([has_td]),`;
            }
            let unmarked_items = document.getElementById(this.word_div).querySelectorAll(selector.slice(0, -1));
            let unmarked_ids = [];

            for (let item of unmarked_items) {
                unmarked_ids.push(item.id);
            }

            unmarked_text_data['ids'] = unmarked_ids;
            unmarked_text_data['count'] = unmarked_ids.length;
            resolve('Success');
        });
        get_unmarked_texts_promise.then();
        return unmarked_text_data;
    }

    getUnmarkedTables = function () {
        let unmarked_table_data = {};
        let get_unmarked_tables_promise = new Promise((resolve, reject) => {
            let unmarked_tables = document.getElementById(this.word_div).querySelectorAll('table:not([elem_type');
            let unmarked_ids = [];

            for (let table in unmarked_tables) {
                unmarked_ids.push(table.id);
            }
            unmarked_table_data['ids'] = unmarked_ids;
            unmarked_table_data['count'] = unmarked_ids.length;
            resolve('Success');
        });
        get_unmarked_tables_promise.then();
        return unmarked_table_data;

    }
    */

    resetFile(){
        let reset_file_promise = new Promise((resolve, reject) => {
            let marked_tags = document.getElementById(this.word_div).querySelectorAll('[elem_type]');
            let missing_ans_tags = document.getElementById(this.word_div).querySelectorAll(`[${this.missing_ans_cell_attr}]`);

            this.setTypeAttribute(marked_tags, null, ParserSelectionType.DESELECT);
            this.setTypeAttribute(missing_ans_tags, null, ParserSelectionType.DESELECT, null, this.missing_ans_cell_attr);
            resolve('Success');
        });

        let res;
        reset_file_promise.then(
            function (value) {
                res = value;
            },
            function (error) {
                console.error(error);
                console.error('Error while resetting markings');
            }
        );
    }

    checkAnswerCellMapping() {
        let table_ids = [];
        let check_answer_cell_mapping_promise = new Promise((resolve, reject) => {
            // Reset previously marked missing cells and tables first
            let missing_items = document.getElementById(this.word_div).querySelectorAll(`[${this.missing_ans_cell_attr}]`);
            this.setTypeAttribute(missing_items, null, ParserSelectionType.DESELECT, null, this.missing_ans_cell_attr);

            let custom_tables:any = document.getElementById(this.word_div).querySelectorAll(`table[elem_type="${ParserElementType.CUSTOM_TABLE}"]`);
            for (let table of custom_tables) {
                let marked_items = table.querySelectorAll('[elem_type]');
                let missing_answer_cell_found = false;

                let question = null;
                let question_row = 0;

                for (let elem of marked_items) {
                    let elem_type = elem.getAttribute('elem_type');
                    if (question && (elem_type != ParserElementType.ANSWER || (this.getTagParent(elem, 'TR').rowIndex - question_row) > 1)) {
                        missing_answer_cell_found = true;
                        question.setAttribute(this.missing_ans_cell_attr, true);

                        question = null;
                    } else if (question && elem_type == ParserElementType.ANSWER) {
                        question = null;
                    }

                    if (elem_type == ParserElementType.QUESTION) {
                        question = elem;
                        question_row = this.getTagParent(question, 'TR').rowIndex;
                    }
                }

                if (question) {
                    missing_answer_cell_found = true;
                    question.setAttribute(this.missing_ans_cell_attr, true);
                }

                if (missing_answer_cell_found) {
                    table.setAttribute(this.missing_ans_cell_attr, true);
                    table_ids.push(table.id);
                }
            }
            resolve(table_ids);
        });

        let res;
        check_answer_cell_mapping_promise.then(function (value) {
            res = value;
        }, function (error) {
            console.error(error);
            console.error('Error while checking answer cell mapping');
        });
        return table_ids;
    }

    getRowColumnHeadings = function (table, type) {
        /*
        Three types of tables for which we can create a Grid Type Question which is supported by our platform
            1- Only the 1st row has headings
            2- Only the 1st column has headings
            3- Both 1st row and 1st column has headings
        */
        let table_rows = table.rows;
        let first_row = table_rows[0].cells;
        let row_headings = [];
        let column_headings = [];
        let no_of_heading_in_row = 0;
        let no_of_heading_in_col = 0;

        let start_row, start_col;
        //For each cell within the first row of the table
        for (let [i, cell] of Array.from(first_row).entries()) {
            let tempcell:any = cell;
            let cell_text = tempcell.getAttribute('elem_text');
            //If the cell has a text
            if (cell_text) {
                no_of_heading_in_col++; // increment the 'no_of_heading_in_col' counter by 1 
            } 
            //If cell is empty and has no text, give a custom tetx to it.
            else {
                cell_text = `Column ${i}`;
            }
            //Push the cell text in the 'column_headings' array
            column_headings.push(cell_text);
        }
        //For each row within the table(including the header row)
        for (let [i, row] of Array.from(table_rows).entries()) {
            //Get the row
            let temprow:any = row;
            //Get the first cell within the row
            let cell = temprow.cells[0];
            //Get the text for that cell
            let cell_text = cell.getAttribute('elem_text');
            //If the cell has a text
            if (cell_text) {
                no_of_heading_in_row++;// increment the 'no_of_heading_in_row' counter by 1 
            } 
            //If cell is empty and has no text, give a custom tetx to it.
            else {
                cell_text = `Row ${i}`;
            }
            //Push the cell text in the 'row_headings' array
            row_headings.push(cell_text);
        }

        if (type == ParserElementType.GRID)
         {
            if (no_of_heading_in_row > 1 && no_of_heading_in_col > 1) {
                // Type 3 table
                row_headings.shift();
                column_headings.shift();
                start_row = 1;
                start_col = 1;
            } else if (no_of_heading_in_col <= 1) {
                // Type 2 table
                column_headings = Array(column_headings.length - 1);
                for (let i = 0; i < column_headings.length; i++) {
                    column_headings[i] = `Column ${i + 1}`;
                }
                start_row = 0;
                start_col = 1;
            } else if (no_of_heading_in_row <= 1) {
                // Type 1 table
                row_headings = Array(row_headings.length - 1);
                for (var i = 0; i < row_headings.length; i++) {
                    row_headings[i] = `Row ${i + 1}`;
                }
                start_row = 1;
                start_col = 0;

            }
        } else if (type == ParserElementType.DYNAMIC_GRID) {
            start_row = 1;
            start_col = 0;
            row_headings = [];
        }

        return {
            'row_headers': row_headings,
            'column_headers': column_headings,
            'start_row': start_row,
            'start_col': start_col
        }

    }

    //The result goes in as parameters to 'manage_excel_template'
    //The result of this function is all the marked Categories/SubCategories/Question, we see in the preview screen
    exportData = function (doc_id, template_name) {
        let export_data = {
            'Document_id': doc_id,
            'name': template_name,
            'sections': []
        };

        let export_data_promise = new Promise((resolve, reject) => {
            //elem_type is a custom attribute that we apply to the tags, whenever we mark something as category,question,answer etc.
            //Get all the the marked elements
            let marked_items:any = document.getElementById(this.word_div).querySelectorAll('[elem_type]');
            let grid_title = null;

            let section_obj = {
                'text': template_name, // Use file name here
                'subSections': []
            }

            let sub_section_obj = {
                'text': template_name, //Use file name here
                'questions': []
            }

            for (let item of marked_items) {
                let text = item.getAttribute('elem_text');
                //If text is empty AND it isnt a table, continue
                if (!text && item.tagName != 'TABLE') continue;
                let type = item.getAttribute('elem_type');

                if (type == ParserElementType.SECTION) {
                    if (sub_section_obj.questions.length > 0) {
                        let sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj));
                        section_obj.subSections.push(sub_section_obj_copy);
                    }

                    if (section_obj.subSections.length > 0) {
                        let section_obj_copy = JSON.parse(JSON.stringify(section_obj));
                        export_data.sections.push(section_obj_copy);
                    }

                    section_obj.text = text;
                    section_obj.subSections = [];
                    sub_section_obj.text = text;
                    sub_section_obj.questions = [];
                } else if (type == ParserElementType.SUB_SECTION) {
                    if (sub_section_obj.questions.length > 0) {
                        let sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj));
                        section_obj.subSections.push(sub_section_obj_copy);
                    }
                    sub_section_obj.text = text;
                    sub_section_obj.questions = [];
                } else if (type == ParserElementType.QUESTION) {
                    let question_obj = {
                        'text': text,
                        'responseType': 'TextMultiLine',
                        'is_selected': true,
                        'response_coordinates': null,
                        'comment_coordinates': null
                    }
                    //Question is within a table
                    if (item.tagName == 'TD') {
                        let current_row = this.getTagParent(item, 'TR');
                        let row_cells:any = Array.from(current_row.cells);
                        let table = this.getTagParent(current_row, 'TABLE');

                        let table_no = table.getAttribute('table_no');
                        let ques_row_no = current_row.rowIndex;
                        let ques_col_no = item.cellIndex;

                        let current_row_length = row_cells.length;

                        let next_row = table.rows[current_row.rowIndex + 1];
                        if (next_row) {
                            row_cells = row_cells.concat(Array.from(next_row.cells));
                        }

                        for (let i = ques_col_no + 1; i < row_cells.length; i++) {
                            let cell_type = row_cells[i].getAttribute('elem_type');
                            if (question_obj.response_coordinates && question_obj.comment_coordinates)
                                break;

                            if (i >= current_row_length) {
                                ques_row_no++;
                            }
                            if (question_obj.response_coordinates == null && cell_type == ParserElementType.ANSWER) {
                                question_obj.response_coordinates = `0,${table_no},${ques_row_no},${row_cells[i].cellIndex}`;
                            } else if (question_obj.comment_coordinates == null && cell_type == ParserElementType.COMMENT) {
                                question_obj.comment_coordinates = `0,${table_no},${ques_row_no},${row_cells[i].cellIndex}`;
                            }
                        }
                    }
                    sub_section_obj.questions.push(question_obj);
                } else if (type == ParserElementType.GRID_TITLE) {
                    grid_title = text;
                } else if ((type == ParserElementType.GRID || type == ParserElementType.DYNAMIC_GRID) && item.tagName == 'TABLE') {
                    let question_text = 'Grid Question';
                    if (grid_title) {
                        question_text = grid_title;
                        grid_title = null;
                    }
                    let has_merged_cells = item.hasAttribute('merge_cells_present');

                    if (has_merged_cells) {
                        // console.log("Table has merged cells, can't be parsed");
                        continue;
                    }

                    let response_type, dynamic_element;
                    if (type == ParserElementType.GRID) {
                        response_type = 'Grid';
                        dynamic_element = null;
                    } else {
                        response_type = 'DynamicGrid';
                        dynamic_element = 'Row';
                    }

                    let headings = this.getRowColumnHeadings(item, type);
                    let row_headings = headings['row_headers'];
                    let column_headings = headings['column_headers'];
                    let start_row = headings['start_row'];
                    let start_col = headings['start_col'];
                    let table_no = item.getAttribute('table_no');

                    let question_obj = {
                        'text': question_text,
                        'is_selected': true,
                        'responseType': response_type,
                        'response_coordinates': `1,${table_no},${start_row},${start_col}`,
                        'grid': {
                            'dataType': 'Integer',
                            'dynamic_element': dynamic_element,
                            'rows_columns': []
                        }
                    }

                    if (type == ParserElementType.GRID) {
                        for (let [ind, rh] of row_headings.entries()) {
                            let row_object = {
                                'name': rh,
                                'elementType': 'Row',
                                'order': ind + 1
                            }
                            question_obj.grid.rows_columns.push(row_object);
                        }
                    }

                    for (let [ind, ch] of column_headings.entries()) {
                        let column_object = {
                            'name': ch,
                            'elementType': 'Column',
                            'order': ind + 1,
                            'type': 'text',
                            'type_options': {
                                'type': 'text'
                            }
                        }
                        question_obj.grid.rows_columns.push(column_object);
                    }
                    // console.log('question_obj', question_obj);
                    sub_section_obj.questions.push(question_obj);
                }
            }
            if (sub_section_obj.questions.length > 0) {
                section_obj.subSections.push(sub_section_obj);
            }
            if (section_obj.subSections.length > 0) {
                export_data.sections.push(section_obj);
            }
            resolve('Success');
        });

        let res;
        export_data_promise.then(
            function (value) {
                res = value;
            },
            function (error) {
                console.error(error);
                console.error('Error while exporting data')
            }
        );
        // console.log('export_data', export_data);
        return export_data;
    }
}
