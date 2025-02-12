(function (global) {
    this.WordParserV1 = WordParserV1;

    function WordParserV1(id, parser_type = ParserType.QA_WORD_UPLOAD) {
        this.word_div = id;
        this.parser_type = parser_type;
        this.hasMergedTables = false;

        this.text_parent_tags = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
        this.text_child_tags = ['SPAN'];
        this.other_text_tags = ['OL', 'UL'];
        this.table_parent_tags = ['TD'];

        this.text_tags = this.text_parent_tags.concat(this.text_child_tags);
        this.all_tags = this.text_tags.concat(this.table_parent_tags).concat(this.other_text_tags);

        this.missing_ans_cell_attr = 'missing_answer_cell';
        this.undo_states = [];
        this.redo_states = [];
    }

    WordParserV1.prototype.getTagStyle = function (tag) {
        let style = getComputedStyle(tag);
        let tag_style = style['color'] + style['fontFamily'] + style['fontSize'] + style['backgroundColor'] + style['fontWeight'];
        tag_style = tag_style.replaceAll('"', '');
        tag_style = tag_style.replaceAll('\'', '');

        return tag_style;
    }

    WordParserV1.prototype.getTagParent = function (tag, parent_tag_name = null, grand_parent_tag_name = null) {

        if (parent_tag_name) {
            while (tag && tag.tagName != parent_tag_name) {
                tag = tag.parentElement;
            }
        } else if (grand_parent_tag_name) {
            while (tag && tag.parentElement.tagName != grand_parent_tag_name) {
                tag = tag.parentElement;
            }
        }
        else if (parent_tag_name == null) {
            while (tag && !this.text_parent_tags.includes(tag.tagName)) {
                tag = tag.parentElement;
            }
        }
        return tag;
    }

    WordParserV1.prototype.check_list_table_element = function (element) {
        // This function is used to get the parent tag (ol, ul, table) of the element if the tag is li or td.
        if (element.tagName === 'LI') {
            element = element.parentElement;
        }
        else if (element.tagName === 'TD') {
            while (element && element.tagName != 'TABLE') {
                element = element.parentElement;
            }
        }
        return element;
    }

    WordParserV1.prototype.nextUntil = function (elem_id, selector_id, operation = ParserSelectionType.SELECT, create_container = true) {

        if (elem_id == selector_id) {
            return;
        }
        // console.log('nextUntil', elem_id, selector_id, operation, create_container);

        let answer_div = null, next_elem = null;
        let elem = document.getElementById(elem_id);
        // let selector = document.getElementById(selector_id);
        // console.log(elem, typeof(elem));
        // console.log(selector, typeof(selector));

        // Get the next sibling element

        if (create_container) {
            answer_div = document.createElement('qa_answer');
            next_elem = elem.nextElementSibling;
            elem.after(answer_div);
            // console.log(answer_div);
            elem = next_elem;
        }


        // As long as a sibling exists
        while (elem && elem.id != selector_id) {
            next_elem = elem.nextElementSibling;

            if (elem.querySelectorAll('[elem_type]').length > 0) break;

            if (operation == ParserSelectionType.SELECT) {
                elem.setAttribute('elem_type', ParserElementType.QA_ANSWER);
                let html_text = this.getTagText(elem);
                if (html_text) {
                    elem.setAttribute('has_text', true);
                }
            } else if (operation == ParserSelectionType.DESELECT) {
                elem.removeAttribute('elem_type');
            }

            if (create_container) {
                answer_div.appendChild(elem);
            }
            elem = next_elem;
        }

        if (create_container) {
            answer_div.setAttribute('elem_type', ParserElementType.QA_ANSWER_DIV);
            return answer_div;
        }
    };

    WordParserV1.prototype.getTagText = function (tag) {
        let text = tag.innerText;
        if (tag.tagName === 'LI') {
            let _o_nested_lists = tag.querySelectorAll(':scope > ol');
            let _u_nested_lists = tag.querySelectorAll(':scope > ul');

            for (let node of _o_nested_lists) {
                node_text = node.innerText;
                text = text.replace(node_text, '');
            }

            for (let node of _u_nested_lists) {
                node_text = node.innerText;
                text = text.replace(node_text, '');
            }
        }
        return text.trim().replace(/\s\s+/g, ' ');
    }

    WordParserV1.prototype.truncateText = function (text, size) {
        let truncated_flag = false;
        if (text.length > size) {
            text = text.slice(0, size - 3) + '...';
            truncated_flag = true;
        }
        return [text, truncated_flag];
    }

    WordParserV1.prototype.processHTMLContent = function (html_str) {
        let frag = document.createElement('frag');
        frag.innerHTML = html_str;
        let html_text = this.getTagText(frag);
        let has_imgage = frag.querySelector('img');
        if (!(html_text || has_imgage)) {
            return '';
        }
        let fn_tags = frag.querySelectorAll('a[fn_ref]');
        // console.log('FN tags', fn_tags);

        for (let [ind, fn_tag] of fn_tags.entries()) {
            let fn_content = fn_tag.getAttribute('fn_content');

            let span = document.createElement('span');
            span.id = `#wk_ft${ind + 1}`;
            span.className = 'fnoteWrap';
            span.setAttribute('contenteditable', false);

            let sup = document.createElement('sup');
            sup.className = 'fnoteBtn';
            sup.title = fn_content;
            sup.setAttribute('data-content', fn_content);
            sup.innerText = ind + 1;
            span.appendChild(sup);
            span.append('\u00A0'); // &nbsp

            fn_tag.replaceWith(span);
        }
        return frag.innerHTML;
    }

    WordParserV1.prototype.isTagEmpty = function (tag) {
        if (tag.getAttribute('has_text') == null && tag.tagName != 'IMG' && !tag.querySelector('img')) {
            return false;
        }
        return true;
    }

    WordParserV1.prototype.tableHasMergedCells = function (table) {
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

    WordParserV1.prototype.isTagInsideTable = function (element) {
        while (element && element.tagName != 'TABLE') {
            element = element.parentElement;
        }

        if (element && element.tagName == 'TABLE') {
            return true;
        }
        return false;
    }

    WordParserV1.prototype.setStyleAttribute = function () {
        let set_style_promise = new Promise((resolve, reject) => {
            let elements = document.getElementById(this.word_div).querySelectorAll(this.all_tags.join(', '));

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

            let tables = document.getElementById(this.word_div).querySelectorAll('table');
            for (let [no, table] of tables.entries()) {
                table.id = `table_${no}`;
                table.setAttribute('table_no', no);
                if (this.tableHasMergedCells(table)) {
                    this.hasMergedTables = true;
                    table.setAttribute('merge_cells_present', true);
                }

                let no_of_rows = table.rows.length;
                let no_of_cols = table.rows[0].cells.length;

                if (no_of_rows > 1) {
                    table.setAttribute('multiple_rows', true);
                }
                if (no_of_cols > 1) {
                    table.setAttribute('multiple_cols', true);
                }


            }
            // Handling anchor tags and setting footnote content
            let anchor_tags = document.getElementById(this.word_div).querySelectorAll('a');
            for (let a of anchor_tags) {
                let href = a.getAttribute('href');
                let name_attr = a.getAttribute('name');

                // Unnecessary anchor tag
                if (name_attr && name_attr.search('_ftnref') == 0) {
                    a.remove()
                }
                a.removeAttribute('href');

                if (href && href.search('#_ftn') == 0 && !href.includes('ref')) {
                    let fn_div_id = href.substring(1);
                    let fn_div = document.getElementById(fn_div_id);
                    let fn_content = this.getTagText(fn_div);
                    fn_content = fn_content.substring(fn_content.search(']') + 2);
                    if (fn_content) {
                        a.setAttribute('fn_ref', true);
                        a.setAttribute('fn_content', fn_content);
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
        // console.log(res);
        return res;
    }

    WordParserV1.prototype.setTypeAttribute = function (tags, child_tag, operation, elem_type = null, attr = 'elem_type') {
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

    WordParserV1.prototype.markOrUnmarkTextTags = function (tag, operation, elem_type) {
        // console.log('inside markOrUnmarkTextTags', tag, operation, elem_type)
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            this.addUndoState();
            let parent_tag = this.getTagParent(tag);
            if (!parent_tag) {
                reject(`couldn't find the parent tag for this tag: ${tag.tagName}`);
            }

            let parent_tag_name = parent_tag.tagName;
            let selector = '';
            let tags = [];

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

    WordParserV1.prototype.markOrUnmarkTableTags = function (tag, operation, elem_type, add_undo_state = true, all_table_marking_flag = true) {
        // console.log('Inside markOrUnmarkTableTags', tag, operation, elem_type);
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            if (add_undo_state)
                this.addUndoState();

            let table;
            let marked_tables = []

            if (elem_type != ParserElementType.ANSWER || operation == ParserSelectionType.SELECT || operation == ParserSelectionType.DESELECT) {
                let tags = [];
                let td_tag = this.getTagParent(tag, 'TD');
                table = this.getTagParent(td_tag, 'TABLE');
                marked_tables.push(table);
                let td_tag_type = td_tag.getAttribute('elem_type');
                let column_no = td_tag.cellIndex + 1;
                let selector = '';

                if (operation == ParserSelectionType.SELECT || operation == ParserSelectionType.DESELECT) {
                    // If single tag operation, then just add that tag to the array
                    tags = [td_tag];
                } else {
                    if (operation == ParserSelectionType.SELECT_SIMILAR) {
                        // For select similar, get all the cells that has text in the column
                        selector = `td:nth-child(${column_no}):not([empty_td])`;
                    }
                    else if (operation == ParserSelectionType.DESELECT_SIMILAR) {
                        if (td_tag_type == ParserElementType.ANSWER) {
                            // For unmarking answer, pick all the cells in the column that are marked as answer alone not other types
                            selector = `td:nth-child(${column_no})[elem_type="${ParserElementType.ANSWER}"]`;
                            operation = ParserSelectionType.DESELECT;
                        }
                        else {
                            // When unmarking cat/sub-cat/ques, pick all the cells that are marked in the column
                            selector = `td:nth-child(${column_no})[elem_type]:not([empty_td])`;
                        }
                    }
                    else if (operation == ParserSelectionType.DESELECT_TYPE) {
                        // When unmarking a particular type of selection (cat, sub-cat, ques) in the table
                        selector = `[elem_type="${elem_type}"]`;
                    }
                    else if (operation == ParserSelectionType.DESELECT_ALL) {
                        // When all the selections has to be unmarked in the table
                        selector = '[elem_type]';
                    }

                    if (all_table_marking_flag) {
                        /*
                            When marking has to be done in all the tables, fetch td tags from
                            all the tables that are not marked as grid using the above selector
                        */
                        let unmarked_tables = document.getElementById(this.word_div).querySelectorAll(`table:not([elem_type="${ParserElementType.GRID}"]):not([elem_type="${ParserElementType.DYNAMIC_GRID}"])`);

                        for (let tbl of unmarked_tables) {
                            let table_tags = Array.from(tbl.querySelectorAll(selector));
                            if (table_tags.length > 0) {
                                marked_tables.push(tbl);
                                tags.push(...table_tags);
                            }

                        }

                    } else {
                        // Fetching tags from the particual table when all table marking is turned off
                        tags = table.querySelectorAll(selector);
                    }
                }
                this.setTypeAttribute(tags, tag, operation, elem_type);
            } else if (elem_type == ParserElementType.ANSWER) {
                let td_tag = this.getTagParent(tag, 'TD');
                table = this.getTagParent(td_tag, 'TABLE');
                let column_no = td_tag.cellIndex;
                // console.log('column_no', column_no);

                let tr_tags = [];
                let tmp_tags = Array.from(table.querySelectorAll('tr'));
                tr_tags.push(...tmp_tags);
                if (all_table_marking_flag) {
                    let marked_tables = document.getElementById(this.word_div).querySelectorAll(`table[elem_type="${ParserElementType.CUSTOM_TABLE}"]`);
                    for (let tbl of marked_tables) {
                        tmp_tags = Array.from(tbl.querySelectorAll('tr'));
                        tr_tags.push(...tmp_tags);
                    }
                }


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

            for (let tbl of marked_tables) {
                let has_question = tbl.querySelector(`[elem_type=${ParserElementType.QUESTION}]`);
                if (has_question) {
                    tbl.setAttribute('elem_type', ParserElementType.CUSTOM_TABLE);
                } else if (tbl.getAttribute('elem_type' == ParserElementType.CUSTOM_TABLE)) {
                    tbl.removeAttribute('elem_type');
                }
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

    WordParserV1.prototype.markOrUnmarkGrids = function (tag, operation, elem_type) {
        // console.log('Inside markOrUnmarkGrids', tag, operation, elem_type);
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            this.addUndoState();
            this.markOrUnmarkTableTags(tag, ParserSelectionType.DESELECT_ALL, null, false, false);
            let table = this.getTagParent(tag, 'TABLE');

            let merge_cells_present = table.hasAttribute('merge_cells_present');

            if (merge_cells_present && elem_type == ParserElementType.DYNAMIC_GRID) {
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

    WordParserV1.prototype.getMarkingsCount = function () {
        // console.log('Inside getMarkingsCount');
        let counts_obj = {};
        let get_markings_count = new Promise((resolve, reject) => {

            counts_obj[ParserElementType.SECTION] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.SECTION}"]`).length;
            counts_obj[ParserElementType.SUB_SECTION] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.SUB_SECTION}"]`).length;
            counts_obj[ParserElementType.QUESTION] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.QUESTION}"], [elem_type="${ParserElementType.GRID}"], [elem_type="${ParserElementType.DYNAMIC_GRID}"]`).length;
            counts_obj[ParserElementType.ANSWER] = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.ANSWER}"]`).length;
            let qa_answers_divs = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.QA_ANSWER_DIV}"]`);

            for (let qa_answer_div of qa_answers_divs) {
                let answer_item_has_text = qa_answer_div.querySelector(`[elem_type="${ParserElementType.QA_ANSWER}"][has_text]`);
                let has_image = qa_answer_div.querySelector('img');
                if (answer_item_has_text || has_image) {
                    counts_obj[ParserElementType.ANSWER]++;
                }
            }
            res = counts_obj;
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
    WordParserV1.prototype.getUnmarkedTexts = function () {
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

    WordParserV1.prototype.getUnmarkedTables = function () {
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

    WordParserV1.prototype.resetFile = function (only_qa_answer = null, reset_states = false, remove_answer_div = true) {

        let reset_file_promise = new Promise((resolve, reject) => {

            // Removing the answer_div which was added while auto marking answers for qa word
            if (remove_answer_div && this.parser_type == ParserType.QA_WORD_UPLOAD) {
                let answer_divs = document.getElementById(this.word_div).querySelectorAll(`qa_answer[elem_type="${ParserElementType.QA_ANSWER_DIV}"]`);

                for (let ans_div of answer_divs) {
                    let fragment = document.createDocumentFragment();
                    while (ans_div.firstChild) {
                        fragment.appendChild(ans_div.firstChild);
                    }
                    ans_div.parentNode.replaceChild(fragment, ans_div);
                }

                for (let state of this.undo_states) {
                    delete state['QA_ANSWER'];
                }

                for (let state of this.redo_states) {
                    delete state['QA_ANSWER'];
                }
            }

            if (only_qa_answer) {
                let marked_qa_answers = document.getElementById(this.word_div).querySelectorAll(`[elem_type="${ParserElementType.QA_ANSWER}"]`);
                this.setTypeAttribute(marked_qa_answers, null, ParserSelectionType.DESELECT);
            } else {
                let marked_tags = document.getElementById(this.word_div).querySelectorAll('[elem_type]:not(qa_answer)');
                let missing_ans_tags = document.getElementById(this.word_div).querySelectorAll(`[${this.missing_ans_cell_attr}]`);

                this.setTypeAttribute(marked_tags, null, ParserSelectionType.DESELECT);
                this.setTypeAttribute(missing_ans_tags, null, ParserSelectionType.DESELECT, null, this.missing_ans_cell_attr);
            }
            if (reset_states) {
                this.undo_states = [];
                this.redo_states = [];
            }
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

    WordParserV1.prototype.checkAnswerCellMapping = function () {
        let table_ids = [];
        let check_answer_cell_mapping_promise = new Promise((resolve, reject) => {
            // Reset previously marked missing cells and tables first
            let missing_items = document.getElementById(this.word_div).querySelectorAll(`[${this.missing_ans_cell_attr}]`);
            this.setTypeAttribute(missing_items, null, ParserSelectionType.DESELECT, null, this.missing_ans_cell_attr);

            let custom_tables = document.getElementById(this.word_div).querySelectorAll(`table[elem_type="${ParserElementType.CUSTOM_TABLE}"]`);
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

    WordParserV1.prototype.autoMarkAnswers = function () {
        return new Promise((resolve, reject) => {
            this.resetFile(true);
            this.addUndoState();
            let elements = document.getElementById(this.word_div).querySelectorAll('[elem_type]');
            for (let i = 0; i < elements.length; i++) {
                let elem = elements[i];
                let next_elem = elements[i + 1];

                if (elem.tagName == 'TD') {
                    continue;
                }

                let elem_type = elem.getAttribute('elem_type');
                if (elem_type == ParserElementType.QUESTION) {
                    let next_elem_id = null;
                    elem = this.check_list_table_element(elem);

                    if (next_elem) {
                        next_elem = this.check_list_table_element(next_elem);
                        next_elem_id = next_elem.id;
                    }

                    let elem_id = elem.id;
                    let response = this.nextUntil(elem_id, next_elem_id, operation = ParserSelectionType.SELECT, create_container = true);
                }
            }
            resolve('Success');
        });
    }

    WordParserV1.prototype.editQAAnswerMarking = function (start_tag, end_tag, operation) {

        let edit_qa_answer_marking_promise = new Promise((resolve, reject) => {
            this.addUndoState();
            // console.log('editQAAnswerMarking', start_tag, end_tag, operation);

            let parent_start_tag = this.getTagParent(start_tag, null, grand_parent_tag_name = 'QA_ANSWER');
            let parent_end_tag = this.getTagParent(end_tag, null, grand_parent_tag_name = 'QA_ANSWER');

            parent_end_tag = parent_end_tag.nextElementSibling;
            // console.log('parents', parent_start_tag, parent_end_tag);

            let start_id = parent_start_tag.id;
            let end_id = (parent_end_tag ? parent_end_tag.id : null);
            // console.log('ids', start_id, end_id);

            this.nextUntil(start_id, end_id, operation, create_container = false);

            resolve('Success');

        });

        let res;
        edit_qa_answer_marking_promise.then(function (value) {
            res = value;
        }, function (error) {
            console.error(error);
            console.error('Error while editing qa answer marking');
        })
    }

    WordParserV1.prototype.markOrUnmarkQAAnswer = function (tag, operation) {
        let mark_or_unmark_promise = new Promise((resolve, reject) => {
            this.addUndoState();
            // console.log('markOrUnmarkQAAnswer', tag, operation);
            let parent_tag = this.getTagParent(tag, null, grand_parent_tag_name = 'QA_ANSWER');
            if (parent_tag) {
                this.setTypeAttribute([parent_tag], null, operation, ParserElementType.QA_ANSWER);
            }

            resolve('Success');
        });

        let res;
        mark_or_unmark_promise.then(function (value) {
            res = value
        }, function (error) {
            console.error(error);
            console.error('Error while marking or unmarking QAAnswer');
        })
    }

    WordParserV1.prototype.getRowColumnHeadings = function (table, type) {
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

        for (let [i, cell] of Array.from(first_row).entries()) {
            let cell_text = cell.getAttribute('elem_text');

            if (cell_text) {
                no_of_heading_in_col++;
            } else {
                cell_text = `Column ${i}`;
            }
            let colspan = cell.colSpan;
            for (let c = 1; c <= colspan; c++) {
                column_headings.push(cell_text);
            }
        }

        for (let [i, row] of Array.from(table_rows).entries()) {
            let cell = row.cells[0];
            let cell_text = cell.getAttribute('elem_text');

            if (cell_text) {
                no_of_heading_in_row++;
            } else {
                cell_text = `Row ${i}`;
            }
            let rowspan = cell.rowSpan;
            for (let r = 1; r <= rowspan; r++) {
                row_headings.push(cell_text);
            }
        }

        if (type == ParserElementType.GRID) {
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
                for (let i = 0; i < row_headings.length; i++) {
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

    WordParserV1.prototype.getGridMetadata = function (table) {
        let merged_cells = table.querySelectorAll('[rowspan],[colspan]');
        let merge_data = [];
        let rows = table?.rows?.length, cols = table?.rows[0]?.cells?.length;

        for (let cell of merged_cells) {
            let cellIdx = 0;
            let nearestRow = cell.closest('tr');
            for (c of Array.from(nearestRow.querySelectorAll('td'))) {
                if (c == cell) break;
                cellIdx += c.colSpan;
            }

            let cell_data = {
                'rowspan': Math.min(cell.rowSpan, rows - 1),
                'colspan': Math.min(cell.colSpan, cols - 1),
                'row': Math.max(nearestRow.rowIndex - 1, 0),
                'col': Math.max(cellIdx - 1, 0)
            }
            merge_data.push(cell_data);
        }
        return { 'mergeCells': merge_data };
    }

    WordParserV1.prototype.exportData = function (doc_id, template_name) {
        let export_data = {
            'Document_id': doc_id,
            'name': template_name,
            'sections': []
        };

        let export_data_promise = new Promise((resolve, reject) => {
            let marked_items = document.getElementById(this.word_div).querySelectorAll('[elem_type]');
            let grid_title = null;

            let section_obj = {
                'text': 'Default Category',
                'is_truncated': false,
                'subSections': []
            }

            let sub_section_obj = {
                'text': 'Default Sub Category',
                'is_truncated': false,
                'questions': []
            }

            for (let [ind, item] of marked_items.entries()) {
                let text = item.getAttribute('elem_text');
                let next_item = marked_items[ind + 1];
                if (!text && item.tagName != 'TABLE') continue;
                let type = item.getAttribute('elem_type');

                if (type == ParserElementType.SECTION) {
                    if (sub_section_obj.questions.length > 0) {
                        let sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj));
                        section_obj.subSections.push(sub_section_obj_copy);
                    }

                    if (section_obj.subSections.length > 0) {
                        section_obj_copy = JSON.parse(JSON.stringify(section_obj));
                        export_data.sections.push(section_obj_copy);
                    }

                    let [section_text, truncated_flag] = this.truncateText(text, 150);

                    section_obj.text = section_text;
                    section_obj.is_truncated = truncated_flag;
                    section_obj.subSections = [];

                    sub_section_obj.text = section_text;
                    sub_section_obj.is_truncated = truncated_flag;
                    sub_section_obj.questions = [];

                } else if (type == ParserElementType.SUB_SECTION) {
                    if (sub_section_obj.questions.length > 0) {
                        sub_section_obj_copy = JSON.parse(JSON.stringify(sub_section_obj));
                        section_obj.subSections.push(sub_section_obj_copy);
                    }

                    let [section_text, truncated_flag] = this.truncateText(text, 150);

                    sub_section_obj.text = section_text;
                    sub_section_obj.is_truncated = truncated_flag;
                    sub_section_obj.questions = [];
                } else if (type == ParserElementType.QUESTION) {

                    // let [question_text, truncated_flag] = this.truncateText(text, 500);

                    let question_obj = {
                        'text': text,
                        'responseType': 'TextMultiLine',
                        'responseTypeDesc': 'Text Explanation - Paragraph',
                        'responseTypeInt': ParserResponseType.TextMultiLine,
                        'responseHTML': '',
                        'commentHTML': '',
                        'is_selected': true,
                        // 'is_truncated': truncated_flag,
                        'response_coordinates': null,
                        'comment_coordinates': null
                    }

                    let responseHTML = '', commentHTML = '';

                    if (item.tagName == 'TD') {
                        let current_row = this.getTagParent(item, 'TR');
                        let row_cells = Array.from(current_row.cells);
                        let table = this.getTagParent(current_row, 'TABLE');

                        let table_no = table.getAttribute('table_no');
                        let ques_col_no = item.cellIndex;

                        let next_row = table.rows[current_row.rowIndex + 1];
                        if (next_row) {
                            row_cells = row_cells.concat(Array.from(next_row.cells));
                        }

                        for (let i = ques_col_no + 1; i < row_cells.length; i++) {
                            let cell_type = row_cells[i].getAttribute('elem_type');
                            if (question_obj.response_coordinates && question_obj.comment_coordinates)
                                break;

                            if (question_obj.response_coordinates == null && cell_type == ParserElementType.ANSWER) {
                                question_obj.response_coordinates = `0,${table_no},${row_cells[i].closest('tr').rowIndex},${row_cells[i].cellIndex}`;

                                if (this.parser_type == ParserType.QA_WORD_UPLOAD) {
                                    responseHTML = row_cells[i].innerHTML;
                                }
                            } else if (question_obj.comment_coordinates == null && cell_type == ParserElementType.COMMENT) {
                                question_obj.comment_coordinates = `0,${table_no},${row_cells[i].closest('tr').rowIndex},${row_cells[i].cellIndex}`;

                                if (this.parser_type == ParserType.QA_WORD_UPLOAD) {
                                    commentHTML = row_cells[i].innerHTML;
                                }
                            }
                        }
                    } else if (this.parser_type == ParserType.QA_WORD_UPLOAD && next_item) {
                        let next_item_type = next_item.getAttribute('elem_type');
                        if (next_item_type == ParserElementType.QA_ANSWER_DIV) {
                            let qa_answer_items = Array.from(next_item.querySelectorAll(`[elem_type="${ParserElementType.QA_ANSWER}"]`));

                            // Trimming empty tags in the beginning and in the end
                            while (qa_answer_items.length) {
                                let answer_item = qa_answer_items[0];
                                if (this.isTagEmpty(answer_item)) {
                                    break
                                }
                                qa_answer_items.shift();
                            }

                            while (qa_answer_items.length) {
                                let answer_item = qa_answer_items[qa_answer_items.length - 1];
                                if (this.isTagEmpty(answer_item)) {
                                    break
                                }
                                qa_answer_items.pop();
                            }

                            responseHTML = '';
                            for (let item of qa_answer_items) {
                                responseHTML += item.outerHTML;
                            }
                        }
                    }

                    // console.log('exportData responseHTML', responseHTML);
                    question_obj.responseHTML = this.processHTMLContent(responseHTML);
                    question_obj.commentHTML = commentHTML;

                    sub_section_obj.questions.push(question_obj);
                } else if (type == ParserElementType.GRID_TITLE) {
                    grid_title = text;
                } else if ((type == ParserElementType.GRID || type == ParserElementType.DYNAMIC_GRID) && item.tagName == 'TABLE') {
                    let question_text = 'Grid Question', truncated_flag = false;

                    if (grid_title) {
                        question_text = grid_title;
                        grid_title = null;
                    }

                    [question_text, truncated_flag] = this.truncateText(question_text, 500);
                    let has_merged_cells = item.getAttribute('merge_cells_present');

                    if (has_merged_cells && type == ParserElementType.DYNAMIC_GRID) {
                        // console.log("Table has merged cells, can't be parsed");
                        continue;
                    }

                    let response_type, response_type_int, dynamic_element;
                    if (type == ParserElementType.GRID) {
                        response_type_int = ParserResponseType.Grid;
                        response_type = 'Grid';
                        dynamic_element = null;
                    } else {
                        response_type_int = ParserResponseType.DynamicGrid;
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
                        'is_truncated': truncated_flag,
                        'responseType': response_type,
                        'responseTypeDesc': response_type,
                        'responseTypeInt': response_type_int,
                        'response_coordinates': `1,${table_no},${start_row},${start_col}`,
                        'grid': {
                            'dataType': 'Integer',
                            'dynamic_element': dynamic_element,
                            'rows_columns': [],
                            'metadata': this.getGridMetadata(item)
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

    WordParserV1.prototype.getMarkingState = function () {
        let marked_items = document.getElementById(this.word_div).querySelectorAll('[elem_type]:not(qa_answer)');
        let marking_state = {};
        for (let item of marked_items) {
            let elem_type = item.getAttribute('elem_type');
            let id = item.id;

            if (!(elem_type in marking_state)) marking_state[elem_type] = [];
            marking_state[elem_type].push(id);
        }
        return marking_state;
    }

    WordParserV1.prototype.setMarkingState = function (marking_state) {
        this.resetFile(false, false, false);
        for (let elem_type in marking_state) {
            let elem_ids = marking_state[elem_type];
            for (let id of elem_ids) {
                document.getElementById(id).setAttribute('elem_type', elem_type);
            }
        }
    }

    WordParserV1.prototype.addUndoState = function (reset_redo = true) {
        let undo_state = this.getMarkingState();
        this.undo_states.push(undo_state);
        if (reset_redo) {
            this.redo_states = [];
        }
        // console.log('Undo states', this.undo_states);
        // console.log('Redo states', this.redo_states);
    }

    WordParserV1.prototype.addRedoState = function () {
        let redo_state = this.getMarkingState();
        this.redo_states.push(redo_state);
        // console.log('Undo states', this.undo_states);
        // console.log('Redo states', this.redo_states);
    }

    WordParserV1.prototype.executeUndo = function () {
        let execute_undo = new Promise((resolve, reject) => {
            if (!this.undo_states.length) {
                reject('No undo states exists');
            } else {
                let undo_state = this.undo_states.pop();
                this.addRedoState();
                this.setMarkingState(undo_state);
                // console.log('Undo states', this.undo_states);
                // console.log('Redo states', this.redo_states);
                resolve('Success');
            }
        })
    }

    WordParserV1.prototype.executeRedo = function () {
        let execute_redo = new Promise((resolve, reject) => {
            if (!this.redo_states.length) {
                reject('No redo states available');
            } else {
                let redo_state = this.redo_states.pop();
                this.addUndoState(false);
                this.setMarkingState(redo_state);
                // console.log('Undo states', this.undo_states);
                // console.log('Redo states', this.redo_states);
                resolve('Success');
            }
        })
    }

})(this);
