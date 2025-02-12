import {
  ParserType,
  ParserElementType,
  ParserResponseType,
  ParserSelectionType,
  ParserElementAttributes,
} from "./constants";
export function WordParser(id, parser_type = ParserType.QA_WORD_UPLOAD) {
  this.word_div = id;
  this.wordDivElement = document.getElementById(id);
  this.wordDivElementOffsetLeft = Math.floor(
    this.wordDivElement.getBoundingClientRect()["left"]
  );
  this.parser_type = parser_type;
  this.hasMergedTables = false;

  this.text_parent_tags = ["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6"];
  this.header_tags = ["H1", "H2", "H3", "H4", "H5", "H6"];
  this.text_child_tags = ["SPAN"];
  this.other_text_tags = ["OL", "UL"];
  this.table_parent_tags = ["TD"];

  this.text_tags = this.text_parent_tags.concat(this.text_child_tags);
  this.all_tags = this.text_tags
    .concat(this.table_parent_tags)
    .concat(this.other_text_tags);

  this.missing_ans_cell_attr = "missing_answer_cell";
  this.undo_states = [];
  this.redo_states = [];
}

WordParser.prototype.getTagStyle = function (tag) {
  let style = getComputedStyle(tag);
  let tag_style =
    style["color"] +
    style["fontFamily"] +
    Math.floor(parseInt(style["fontSize"].replace("px", ""))) +
    "px" +
    style["backgroundColor"] +
    style["fontWeight"] +
    style["fontStyle"];
  tag_style = tag_style.replaceAll('"', "");
  tag_style = tag_style.replaceAll("'", "");

  // Indentation is rounded to nearest multiples of 10px
  const distanceFromLeft =
    Math.floor(
      (Math.max(
        tag.getBoundingClientRect()["left"] +
          parseInt(style["textIndent"], 10) -
          this.wordDivElementOffsetLeft,
        0
      ) -
        10) /
        10
    ) * 10;
  return [tag_style, distanceFromLeft];
};

WordParser.prototype.getTagParent = function (
  tag,
  parent_tag_name = null,
  grand_parent_tag_name = null
) {
  if (parent_tag_name) {
    while (tag && tag.tagName != parent_tag_name) {
      tag = tag.parentElement;
    }
  } else if (grand_parent_tag_name) {
    while (tag && tag.parentElement.tagName != grand_parent_tag_name) {
      tag = tag.parentElement;
    }
  } else if (parent_tag_name == null) {
    while (tag && !this.text_parent_tags.includes(tag.tagName)) {
      tag = tag.parentElement;
    }
  }
  return tag;
};

WordParser.prototype.check_list_table_element = function (element) {
  // This function is used to get the parent tag (ol, ul, table) of the element if the tag is li or td.
  if (element.tagName === "LI") {
    element = element.parentElement;
  } else if (element.tagName === "TD") {
    while (element && element.tagName != "TABLE") {
      element = element.parentElement;
    }
  }
  return element;
};

WordParser.prototype.nextUntil = function (
  elem_id,
  operation = ParserSelectionType.SELECT,
  visited = null
) {
  if (visited == null) visited = new Set();

  if (visited.has(elem_id)) return;

  let next_elem = null;
  let elem = document.getElementById(elem_id);
  elem = this.getTableOrTextParent(elem);

  // As long as a sibling exists
  while (elem) {
    next_elem = elem.nextElementSibling;

    // Checking if the element contains any category/sub-category/question markings
    if (
      (elem.hasAttribute("elem_type") &&
        elem.getAttribute("elem_type") != ParserElementType.QA_ANSWER &&
        elem.getAttribute("elem_type") != ParserElementType.INSTRUCTION) ||
      elem.querySelector(
        `[elem_type]:not([elem_type="${ParserElementType.QA_ANSWER}"]):not([elem_type="${ParserElementType.INSTRUCTION}"]), [class^="elem_type-"]:not([class="elem_type-${ParserElementType.QA_ANSWER}"]):not([class="elem_type-${ParserElementType.INSTRUCTION}"])`
      )
    )
      break;

    // Checking if there are any already marked answers or instructions
    if (
      visited.has(elem.id) ||
      elem.querySelector(
        `[elem_type="${ParserElementType.QA_ANSWER}"], [class="elem_type-${ParserElementType.QA_ANSWER}"], [elem_type="${ParserElementType.INSTRUCTION}"], [class="elem_type-${ParserElementType.INSTRUCTION}"]`
      ) ||
      elem.getAttribute("elem_type") == ParserElementType.QA_ANSWER ||
      elem.getAttribute("elem_type") == ParserElementType.INSTRUCTION ||
      elem.tagName == "PARSER"
    ) {
      const parser_elem = elem.querySelector("PARSER[elem_type]");
      if (parser_elem) {
        const last_elem = document.getElementById(
          parser_elem.getAttribute("last_selection_id")
        );
        const parent_elem = this.getTagParent(last_elem);
        elem = parent_elem
          ? parent_elem.nextElementSibling
          : last_elem.nextElementSibling;
      } else {
        elem = next_elem;
      }
      continue;
    }

    if (operation == ParserSelectionType.SELECT) {
      elem.setAttribute("elem_type", ParserElementType.QA_ANSWER);
      const decendents = elem.querySelectorAll("[id]") || [];
      visited.add(elem.id);
      for (const elemChild of decendents) {
        visited.add(elemChild.id);
      }
    } else if (operation == ParserSelectionType.DESELECT) {
      elem.removeAttribute("elem_type");
    }
    elem = next_elem;
  }
};

WordParser.prototype.getTagText = function (tag) {
  if (!tag) return "";
  let text = tag.innerText;
  if (tag.tagName === "LI") {
    let _o_nested_lists = tag.querySelectorAll(":scope > ol");
    let _u_nested_lists = tag.querySelectorAll(":scope > ul");

    for (let node of _o_nested_lists) {
      node_text = node.innerText;
      text = text.replace(node_text, "");
    }

    for (let node of _u_nested_lists) {
      node_text = node.innerText;
      text = text.replace(node_text, "");
    }
  }
  return text.trim().replace(/\s\s+/g, " ");
};

WordParser.prototype.truncateText = function (text, size) {
  let truncated_flag = false;
  if (text.length > size) {
    text = text.slice(0, size - 3) + "...";
    truncated_flag = true;
  }
  return [text, truncated_flag];
};

WordParser.prototype.processHTMLContent = function (html_str) {
  let frag = document.createElement("frag");
  frag.innerHTML = html_str;
  let html_text = this.getTagText(frag);
  let has_imgage = frag.querySelector("img");
  if (!(html_text || has_imgage)) {
    return "";
  }
  let fn_tags = frag.querySelectorAll("a[fn_ref]");

  for (let [ind, fn_tag] of fn_tags.entries()) {
    let fn_content = fn_tag.getAttribute("fn_content");

    let span = document.createElement("span");
    span.id = `#wk_ft${ind + 1}`;
    span.className = "fnoteWrap";
    span.setAttribute("contenteditable", false);

    let sup = document.createElement("sup");
    sup.className = "fnoteBtn";
    sup.title = fn_content;
    sup.setAttribute("data-content", fn_content);
    sup.innerText = ind + 1;
    span.appendChild(sup);
    span.append("\u00A0"); // &nbsp

    fn_tag.replaceWith(span);
  }
  return frag.innerHTML;
};

WordParser.prototype.isTagEmpty = function (tag) {
  const elem_text = tag.getAttribute("elem_text");
  if (
    elem_text?.length < 1 &&
    tag.tagName != "IMG" &&
    !tag.querySelector("img")
  ) {
    return true;
  }
  return false;
};

WordParser.prototype.tableHasMergedCells = function (table) {
  let merged_row_cells = table.querySelectorAll("[rowspan]");
  let merged_column_cells = table.querySelectorAll("[colspan]");

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
};

WordParser.prototype.isTagInsideTable = function (element) {
  while (element && element.tagName != "TABLE") {
    element = element.parentElement;
  }

  if (element && element.tagName == "TABLE") {
    return true;
  }
  return false;
};

WordParser.prototype.setStyleAttribute = function () {
  let set_style_promise = new Promise((resolve, reject) => {
    const allElements = document
      .getElementById(this.word_div)
      .querySelectorAll("*");
    for (const [no, elem] of allElements.entries()) {
      elem.id = `text_${no}`;
      if (
        elem.tagName === "SPAN" &&
        elem.textContent.startsWith("###DVpara_") &&
        elem.textContent.endsWith("DV###")
      ) {
        const para_id = elem.textContent
          .replace("###DV", "")
          .replace("DV###", "");
        elem
          .closest(this.text_parent_tags.join(",") + ", DIV")
          ?.setAttribute("para-id", para_id);
        elem.remove();
      }
      // TODO: remove the code from :block 1: after optimizing the table marking
      // if (elem.tagName === 'SPAN' && elem.textContent.startsWith("###DVtable_") && elem.textContent.endsWith("DV###")) {
      //     const para_id = elem.textContent.replace("###DVpara_", "").replace("DV###", "");
      //     elem.closest('TABLE')?.setAttribute('table-id', "table_" + para_id);
      //     elem.remove();
      // }
    }

    let elements = document
      .getElementById(this.word_div)
      .querySelectorAll(this.all_tags.join(", "));
    for (let [no, elem] of elements.entries()) {
      let [elem_style, elem_indent] = this.getTagStyle(elem);
      let elem_text = this.getTagText(elem);
      elem.setAttribute("elem_style", elem_style);
      // To filter the similar elements based on indentation
      elem.setAttribute("elem_indent", elem_indent);

      if (elem_text) {
        elem.setAttribute("elem_text", elem_text);
        // add the cell coordinates as an attribute to the cell and remove the pragraph having these coordinates
        if (elem_text.startsWith("##DV") && elem_text.endsWith("DV##")) {
          const cell = elem.closest("td");
          cell.setAttribute(
            ParserElementAttributes.CELL_COORDS,
            elem_text.slice(4, -4)
          );
          // TODO: Optimize this to use table only once :block 1:
          const table = cell.closest("table");
          const table_no = elem_text.slice(5, -5).split(",")[0];
          table.setAttribute("table-id", "table_" + table_no);
          elem.parentElement.remove();
          continue;
        }
      }

      if (elem.tagName != "TD" && this.isTagInsideTable(elem)) {
        elem.setAttribute("has_td", true);
      }

      if (elem.tagName == "TD" && !elem_text) {
        elem.setAttribute("empty_td", true);
      }
    }

    let tables = document
      .getElementById(this.word_div)
      .querySelectorAll("table");
    for (let [no, table] of tables.entries()) {
      table.setAttribute("table_no", no);
      if (this.tableHasMergedCells(table)) {
        this.hasMergedTables = true;
        table.setAttribute("merge_cells_present", true);
      }

      let no_of_rows = table.rows.length;
      let no_of_cols = table.rows[0].cells.length;

      if (no_of_rows > 1) {
        table.setAttribute("multiple_rows", true);
      }
      if (no_of_cols > 1) {
        table.setAttribute("multiple_cols", true);
      }
    }
    // Handling anchor tags and setting footnote content
    let anchor_tags = document
      .getElementById(this.word_div)
      .querySelectorAll("a");
    for (let a of anchor_tags) {
      let href = a.getAttribute("href");
      let name_attr = a.getAttribute("name");

      // Unnecessary anchor tag
      if (name_attr && name_attr.search("_ftnref") == 0) {
        a.remove();
      }
      a.removeAttribute("href");

      if (href && href.search("#_ftn") == 0 && !href.includes("ref")) {
        let fn_div_id = href.substring(1);
        let fn_div = document.getElementById(fn_div_id);
        let fn_content = this.getTagText(fn_div);
        fn_content = fn_content.substring(fn_content.search("]") + 2);
        if (fn_content) {
          a.setAttribute("fn_ref", true);
          a.setAttribute("fn_content", fn_content);
        }
      }
    }

    resolve("Success");
  });

  let res;
  set_style_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while setting style attribute for tags.");
    }
  );
  return res;
};

WordParser.prototype.setTypeAttribute = function (
  tags,
  child_tag,
  operation,
  elem_type = null,
  attr = "elem_type",
  parent_tag = null
) {
  let child_tag_name, child_tag_style, parent_indent;

  if (child_tag) {
    child_tag_name = child_tag.tagName;
    child_tag_style = child_tag.getAttribute("elem_style");
  }

  parent_indent = parent_tag?.getAttribute("elem_indent");

  let allTags = [];
  for (const tag of tags) {
    allTags.push(tag);
    const id = tag.getAttribute("id");
    const elem_type = tag.getAttribute("elem_type");
    if (elem_type && tag.hasAttribute(ParserElementAttributes.IS_PARENT)) {
      const associatedTags = document.querySelectorAll(
        `[${ParserElementAttributes.ASSOCIATED_TO}=${id}]`
      );
      allTags.push(...Array.from(associatedTags));
    }
  }

  for (let tag of allTags) {
    if (tag.tagName == "PARSER" && tag.className.length > 0) {
      this.setSlectionType(tag, operation, elem_type);
      continue;
    }

    if (
      operation == ParserSelectionType.DESELECT ||
      operation == ParserSelectionType.DESELECT_TYPE ||
      operation == ParserSelectionType.DESELECT_ALL
    ) {
      tag.removeAttribute(attr);
      tag.removeAttribute(ParserElementAttributes.IS_PARENT);
      tag.removeAttribute(ParserElementAttributes.ASSOCIATED_TO);
      this.removeAssociations(tag);
    } else if (operation == ParserSelectionType.SELECT) {
      if (
        // only section, sub-section and question have associated items
        (elem_type != ParserElementType.SECTION &&
          elem_type != ParserElementType.SUB_SECTION &&
          elem_type != ParserElementType.QUESTION) ||
        // if tag has instruction marking and associated to any elemet creates conflict
        tag.getAttribute("elem_type") == ParserElementType.INSTRUCTION
      ) {
        tag.removeAttribute(ParserElementAttributes.ASSOCIATED_TO);
        tag.removeAttribute(ParserElementAttributes.IS_PARENT);
      }
      // Check for highlighted markings inside this element, if it has then remove the marking
      const parserElement = tag.querySelector("parser");
      if (parserElement && parserElement.className.length > 0) {
        this.setSlectionType(parserElement, ParserSelectionType.DESELECT, null);
      }
      tag.setAttribute("elem_type", elem_type);
    } else {
      let text = tag.getAttribute("elem_text");
      let element_exists =
        tag.querySelector(
          `${child_tag_name}[elem_style="${child_tag_style}"]`
        ) &&
        (parent_indent == tag.getAttribute("elem_indent") ||
          tag.tagName == "TD");
      // If the tag is associated to other element then we have to apply the operation irrespective of it's style
      element_exists =
        element_exists ||
        tag.hasAttribute(ParserElementAttributes.ASSOCIATED_TO);
      // Check for highlighted markings inside this element, if it has then skip the element
      const parserElement = tag.querySelector("parser");
      if (parserElement && parserElement.className.length > 0) {
        element_exists = false;
      }
      if (element_exists && text) {
        if (operation == ParserSelectionType.SELECT_SIMILAR) {
          if (
            (elem_type != ParserElementType.SECTION &&
              elem_type != ParserElementType.SUB_SECTION &&
              elem_type != ParserElementType.QUESTION) ||
            tag.getAttribute("elem_type") == ParserElementType.INSTRUCTION
          ) {
            tag.removeAttribute(ParserElementAttributes.ASSOCIATED_TO);
            tag.removeAttribute(ParserElementAttributes.IS_PARENT);
          }
          tag.setAttribute("elem_type", elem_type);
        } else if (operation == ParserSelectionType.DESELECT_SIMILAR) {
          tag.removeAttribute("elem_type");
          tag.removeAttribute(ParserElementAttributes.IS_PARENT);
          tag.removeAttribute(ParserElementAttributes.ASSOCIATED_TO);
          this.removeAssociations(tag);
        }
      }
    }
  }
};

WordParser.prototype.markOrUnmarkTextTags = function (
  tag,
  operation,
  elem_type,
  add_undo_state = true
) {
  let mark_or_unmark_promise = new Promise((resolve, reject) => {
    if (add_undo_state) this.addUndoState();
    let parent_tag = this.getTagParent(tag);
    if (!parent_tag) {
      reject(`couldn't find the parent tag for this tag: ${tag.tagName}`);
    }

    let parent_tag_name = parent_tag.tagName;
    let selector = "";
    let tags = [];

    if (tag.tagName == "PARSER" && tag.className.length > 0) {
      // Checking if the target is a PARSER tag and marked
      tags = [tag];
    } else if (
      operation == ParserSelectionType.SELECT ||
      operation == ParserSelectionType.DESELECT
    ) {
      tags = [parent_tag];
    } else {
      if (operation == ParserSelectionType.SELECT_SIMILAR)
        selector = `${parent_tag_name}`;
      else if (operation == ParserSelectionType.DESELECT_SIMILAR)
        selector = `${parent_tag_name}[elem_type]`;
      else if (operation == ParserSelectionType.DESELECT_TYPE)
        selector = `[elem_type="${elem_type}"]`;
      else if (operation == ParserSelectionType.DESELECT_ALL)
        selector = "[elem_type]";

      selector += ":not([has_td])";
      tags = document.getElementById(this.word_div).querySelectorAll(selector);
    }
    this.setTypeAttribute(
      tags,
      tag,
      operation,
      elem_type,
      "elem_type",
      parent_tag
    );
    resolve("Success");
  });

  let res;
  mark_or_unmark_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while marking or unmarking text tags.");
    }
  );
  return res;
};

WordParser.prototype.markOrUnmarkTableTags = function (
  tag,
  operation,
  elem_type,
  add_undo_state = true,
  all_table_marking_flag = true
) {
  let mark_or_unmark_promise = new Promise((resolve, reject) => {
    if (add_undo_state) this.addUndoState();

    let table;
    let marked_tables = [];

    if (
      elem_type != ParserElementType.ANSWER ||
      operation == ParserSelectionType.SELECT ||
      operation == ParserSelectionType.DESELECT
    ) {
      let tags = [];
      let td_tag = this.getTagParent(tag, "TD");
      table = this.getTagParent(td_tag, "TABLE");
      marked_tables.push(table);
      let td_tag_type = td_tag.getAttribute("elem_type");
      let column_no = td_tag.cellIndex + 1;
      let selector = "";

      if (
        operation == ParserSelectionType.SELECT ||
        operation == ParserSelectionType.DESELECT
      ) {
        // If single tag operation, then just add that tag to the array
        tags = [td_tag];
      } else {
        if (operation == ParserSelectionType.SELECT_SIMILAR) {
          // For select similar, get all the cells that has text in the column
          selector = `td:nth-child(${column_no}):not([empty_td]):not(td table[elem_type] td)`;
        } else if (operation == ParserSelectionType.DESELECT_SIMILAR) {
          if (td_tag_type == ParserElementType.ANSWER) {
            // For unmarking answer, pick all the cells in the column that are marked as answer alone not other types
            selector = `td:nth-child(${column_no})[elem_type="${ParserElementType.ANSWER}"]`;
            operation = ParserSelectionType.DESELECT;
          } else {
            // When unmarking cat/sub-cat/ques, pick all the cells that are marked in the column
            selector = `td:nth-child(${column_no})[elem_type]:not([empty_td])`;
          }
        } else if (operation == ParserSelectionType.DESELECT_TYPE) {
          // When unmarking a particular type of selection (cat, sub-cat, ques) in the table
          selector = `[elem_type="${elem_type}"]`;
        } else if (operation == ParserSelectionType.DESELECT_ALL) {
          // When all the selections has to be unmarked in the table
          selector = "[elem_type]";
        }

        if (all_table_marking_flag) {
          /*
              When marking has to be done in all the tables, fetch td tags from
              all the tables that are not marked as grid using the above selector
          */
          let unmarked_tables = document
            .getElementById(this.word_div)
            .querySelectorAll(
              `table:not([elem_type="${ParserElementType.GRID}"]):not([elem_type="${ParserElementType.DYNAMIC_GRID}"])`
            );

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
      let td_tag = this.getTagParent(tag, "TD");
      table = this.getTagParent(td_tag, "TABLE");
      let column_no = td_tag.cellIndex;

      let tr_tags = [];
      let tmp_tags = Array.from(table.querySelectorAll("tr"));
      tr_tags.push(...tmp_tags);
      if (all_table_marking_flag) {
        let marked_tables = document
          .getElementById(this.word_div)
          .querySelectorAll(
            `table[elem_type="${ParserElementType.CUSTOM_TABLE}"]`
          );
        for (let tbl of marked_tables) {
          tmp_tags = Array.from(tbl.querySelectorAll("tr"));
          tr_tags.push(...tmp_tags);
        }
      }

      // if (operation == ParserSelectionType.DESELECT_SIMILAR) {
      //     let answer_cells = table.querySelectorAll(`td:nth-child(${column_no + 1})[elem_type="${ParserElementType.ANSWER}"]`);
      //     this.setTypeAttribute(answer_cells, null, ParserElementType.DESELECT);
      // }

      for (let [ind, tr_tag] of tr_tags.entries()) {
        let answer_cell = tr_tag.querySelector(
          `td:nth-child(${column_no + 1})`
        );
        if (!answer_cell) {
          continue;
        }
        let questions_in_row = tr_tag.querySelectorAll(
          `[elem_type="${ParserElementType.QUESTION}"]`
        );
        let no_of_questions_in_row = questions_in_row.length;

        if (no_of_questions_in_row == 0 && ind > 0) {
          // logic for question and answer in same column
          let prev_tr = tr_tags[ind - 1];
          let prev_tr_marked_items = prev_tr.querySelectorAll("[elem_type]");
          let prev_tr_last_marked_item =
            prev_tr_marked_items[prev_tr_marked_items.length - 1];

          if (
            prev_tr_last_marked_item &&
            prev_tr_last_marked_item.getAttribute("elem_type") ==
              ParserElementType.QUESTION
          ) {
            answer_cell.setAttribute("elem_type", ParserElementType.ANSWER);
          }
        } else if (no_of_questions_in_row == 1) {
          // logic for row with single question
          if (column_no <= questions_in_row[0].cellIndex) {
            continue;
          }
          let tags = tr_tag.querySelectorAll(
            `[elem_type="${ParserElementType.ANSWER}"]`
          );
          this.setTypeAttribute(tags, null, ParserSelectionType.DESELECT);
          answer_cell.setAttribute("elem_type", ParserElementType.ANSWER);
        } else if (no_of_questions_in_row > 1) {
          // logic for row with more than 1 question
          let selected_elements = tr_tag.querySelectorAll("[elem_type]");
          let question_present = false;

          for (let elem of selected_elements) {
            if (elem.cellIndex >= column_no) break;
            if (elem.getAttribute("elem_type") == ParserElementType.QUESTION) {
              question_present = true;
            } else {
              question_present = false;
            }
          }
          if (question_present) {
            answer_cell.setAttribute("elem_type", elem_type);
          }
        }
      }
    }

    for (let tbl of marked_tables) {
      let has_question = tbl.querySelector(
        `[elem_type=${ParserElementType.QUESTION}]`
      );
      if (has_question) {
        tbl.setAttribute("elem_type", ParserElementType.CUSTOM_TABLE);
      } else if (
        tbl.getAttribute("elem_type" == ParserElementType.CUSTOM_TABLE)
      ) {
        tbl.removeAttribute("elem_type");
      }
    }
    resolve("Success");
  });

  let res;
  mark_or_unmark_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while marking or unmarking table tags.");
    }
  );
  return res;
};

WordParser.prototype.markOrUnmarkGrids = function (tag, operation, elem_type) {
  let mark_or_unmark_promise = new Promise((resolve, reject) => {
    this.addUndoState();
    this.markOrUnmarkTableTags(
      tag,
      ParserSelectionType.DESELECT_ALL,
      null,
      false,
      false
    );
    let table = this.getTagParent(tag, "TABLE");

    let merge_cells_present = table.hasAttribute("merge_cells_present");

    if (merge_cells_present && elem_type == ParserElementType.DYNAMIC_GRID) {
      reject("Has merged cells");
    }

    if (operation == ParserSelectionType.SELECT && elem_type) {
      table.setAttribute("elem_type", elem_type);
    } else if (operation == ParserSelectionType.DESELECT) {
      table.removeAttribute("elem_type");
    }
    resolve("Success");
  });

  let res;
  mark_or_unmark_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while marking or unmarking tables.");
    }
  );
  return res;
};

WordParser.prototype.getMarkingsCount = function () {
  let counts_obj = {};
  let get_markings_count = new Promise((resolve, reject) => {
    counts_obj[ParserElementType.SECTION] = document
      .getElementById(this.word_div)
      .querySelectorAll(
        `[elem_type="${ParserElementType.SECTION}"]:not([${ParserElementAttributes.ASSOCIATED_TO}])`
      ).length;
    counts_obj[ParserElementType.SUB_SECTION] = document
      .getElementById(this.word_div)
      .querySelectorAll(
        `[elem_type="${ParserElementType.SUB_SECTION}"]:not([${ParserElementAttributes.ASSOCIATED_TO}])`
      ).length;
    counts_obj[ParserElementType.INSTRUCTION] = document
      .getElementById(this.word_div)
      .querySelectorAll(
        `[elem_type="${ParserElementType.INSTRUCTION}"]`
      ).length;
    counts_obj[ParserElementType.QUESTION] = document
      .getElementById(this.word_div)
      .querySelectorAll(
        `[elem_type="${ParserElementType.QUESTION}"]:not([${ParserElementAttributes.ASSOCIATED_TO}]), [elem_type="${ParserElementType.GRID}"], [elem_type="${ParserElementType.DYNAMIC_GRID}"]`
      ).length;
    counts_obj[ParserElementType.ANSWER] = document
      .getElementById(this.word_div)
      .querySelectorAll(`[elem_type="${ParserElementType.ANSWER}"]`).length;

    let questions = Array.from(
      document
        .getElementById(this.word_div)
        .querySelectorAll(
          `[elem_type="${ParserElementType.QUESTION}"], [elem_type="${ParserElementType.SUB_QUESTION}"]`
        )
    );
    let last_elem_question = false;
    for (let ind in questions) {
      if (
        questions[ind].getAttribute("elem_type") == ParserElementType.QUESTION
      ) {
        last_elem_question = true;
      } else {
        if (last_elem_question) {
          last_elem_question = false;
        } else {
          counts_obj[ParserElementType.QUESTION]++;
        }
      }
    }

    let markedQaItems = Array.from(
      document
        .getElementById(this.word_div)
        .querySelectorAll(
          `[elem_type="${ParserElementType.QUESTION}"]:not([${ParserElementAttributes.ASSOCIATED_TO}]), [elem_type="${ParserElementType.SUB_QUESTION}"], [elem_type="${ParserElementType.QA_ANSWER}"]`
        )
    );
    let questionsWithRespones = [];
    for (let item of markedQaItems) {
      if (item.getAttribute("elem_type") == ParserElementType.QUESTION)
        questionsWithRespones.push("Q");
      if (item.getAttribute("elem_type") == ParserElementType.QA_ANSWER)
        questionsWithRespones.push("A");
      if (item.getAttribute("elem_type") == ParserElementType.SUB_QUESTION)
        questionsWithRespones.push("S");
      const currLen = questionsWithRespones.length;
      if (
        currLen > 1 &&
        questionsWithRespones[currLen - 2] == "A" &&
        questionsWithRespones[currLen - 1] == "A"
      ) {
        questionsWithRespones.pop();
      } else if (
        currLen > 1 &&
        questionsWithRespones[currLen - 2] == "Q" &&
        questionsWithRespones[currLen - 1] == "S"
      ) {
        questionsWithRespones[currLen - 2] = "S";
        questionsWithRespones.pop();
      } else if (
        currLen > 2 &&
        questionsWithRespones[currLen - 3] == "Q" &&
        questionsWithRespones[currLen - 2] == "A" &&
        questionsWithRespones[currLen - 1] == "S"
      ) {
        questionsWithRespones[currLen - 3] = "S";
        questionsWithRespones[currLen - 2] = "A";
        questionsWithRespones.pop();
      }
    }

    for (let i = 0; i < questionsWithRespones.length; i++) {
      if (
        i > 0 &&
        questionsWithRespones[i] == "A" &&
        (questionsWithRespones[i - 1] == "S" ||
          questionsWithRespones[i - 1] == "Q")
      )
        counts_obj[ParserElementType.ANSWER]++;
    }

    let custom_tables = document
      .getElementById(this.word_div)
      .querySelectorAll(`table[elem_type="${ParserElementType.CUSTOM_TABLE}"]`);
    for (let tbl of custom_tables) {
      if (!tbl.querySelector(`[elem_type]`)) tbl.removeAttribute("elem_type");
    }

    resolve(counts_obj);
  });

  get_markings_count.then(
    function (value) {
      return;
    },
    function (error) {
      console.error(error);
      console.error("Error while getting marking counts");
    }
  );
  return counts_obj;
};

WordParser.prototype.resetFile = function (
  only_qa_answer = null,
  reset_states = false
) {
  let reset_file_promise = new Promise((resolve, reject) => {
    if (only_qa_answer) {
      let marked_qa_answers = document
        .getElementById(this.word_div)
        .querySelectorAll(`[elem_type="${ParserElementType.QA_ANSWER}"]`);
      this.setTypeAttribute(
        marked_qa_answers,
        null,
        ParserSelectionType.DESELECT
      );
    } else {
      let marked_tags = document
        .getElementById(this.word_div)
        .querySelectorAll("[elem_type]:not(qa_answer)");
      let missing_ans_tags = document
        .getElementById(this.word_div)
        .querySelectorAll(`[${this.missing_ans_cell_attr}]`);

      this.setTypeAttribute(marked_tags, null, ParserSelectionType.DESELECT);
      this.setTypeAttribute(
        missing_ans_tags,
        null,
        ParserSelectionType.DESELECT,
        null,
        this.missing_ans_cell_attr
      );
    }
    if (reset_states) {
      this.undo_states = [];
      this.redo_states = [];
    }
    resolve("Success");
  });
  if (!only_qa_answer) {
    const selectionObj = document.querySelectorAll('span[selection="true"]');
    const ids = Object.values(selectionObj)
      .map((x) => x.id)
      ?.toString();
    this.unmarkSelection(ids);
  }

  let res;
  reset_file_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while resetting markings");
    }
  );
};

WordParser.prototype.checkAnswerCellMapping = function () {
  let table_ids = [];
  let check_answer_cell_mapping_promise = new Promise((resolve, reject) => {
    // Reset previously marked missing cells and tables first
    let missing_items = document
      .getElementById(this.word_div)
      .querySelectorAll(`[${this.missing_ans_cell_attr}]`);
    this.setTypeAttribute(
      missing_items,
      null,
      ParserSelectionType.DESELECT,
      null,
      this.missing_ans_cell_attr
    );

    let custom_tables = document
      .getElementById(this.word_div)
      .querySelectorAll(`table[elem_type="${ParserElementType.CUSTOM_TABLE}"]`);
    for (let table of custom_tables) {
      let marked_items = table.querySelectorAll("[elem_type]");
      let missing_answer_cell_found = false;

      let question = null;
      let question_row = 0;

      for (let elem of marked_items) {
        let elem_type = elem.getAttribute("elem_type");
        if (
          question &&
          (elem_type != ParserElementType.ANSWER ||
            this.getTagParent(elem, "TR").rowIndex - question_row > 1)
        ) {
          missing_answer_cell_found = true;
          question.setAttribute(this.missing_ans_cell_attr, true);

          question = null;
        } else if (question && elem_type == ParserElementType.ANSWER) {
          question = null;
        }

        if (elem_type == ParserElementType.QUESTION) {
          question = elem;
          question_row = this.getTagParent(question, "TR").rowIndex;
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
  check_answer_cell_mapping_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while checking answer cell mapping");
    }
  );
  return table_ids;
};

WordParser.prototype.autoMarkAnswers = function () {
  return new Promise((resolve) => {
    this.addUndoState();
    const elements = document
      .getElementById(this.word_div)
      .querySelectorAll('[id^="text_"]');

    let canBeAnswer = false;
    const visitedNodeIds = new Set();

    for (let i = 0; i < elements.length; i++) {
      let elem = elements[i];

      if (visitedNodeIds.has(elem.id)) {
        continue;
      }

      if (elem.tagName == "TD") {
        continue;
      }

      let elem_type = elem.getAttribute("elem_type");
      if (
        elem_type != null &&
        elem_type != ParserElementType.QA_ANSWER &&
        elem_type != ParserElementType.ANSWER &&
        elem_type != ParserElementType.INSTRUCTION
      ) {
        if (
          elem_type == ParserElementType.QUESTION ||
          elem_type == ParserElementType.SUB_QUESTION
        ) {
          canBeAnswer = true;
          continue;
        } else {
          canBeAnswer = false;
        }
      }

      if (canBeAnswer) {
        if (elem.tagName == "PARSER") {
          elem = document.getElementById(
            elem.getAttribute("last_selection_id")
          );
          elem = this.getTagParent(elem);
        }

        elem = this.check_list_table_element(elem);
        this.nextUntil(elem.id, ParserSelectionType.SELECT, visitedNodeIds);
      }
    }
    resolve("Success");
  });
};

WordParser.prototype.getRowColumnHeadings = function (table, type) {
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
    let cell_text = cell.getAttribute("elem_text");

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
    let cell_text = cell.getAttribute("elem_text");

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
    row_headers: row_headings,
    column_headers: column_headings,
    start_row: start_row,
    start_col: start_col,
  };
};

WordParser.prototype.getGridMetadata = function (table, delta_row, delta_col) {
  let merged_cells = table.querySelectorAll("[rowspan],[colspan]");
  let merge_data = [];
  let rows = table?.rows?.length,
    cols = table?.rows[0]?.cells?.length;

  for (let cell of merged_cells) {
    let cellIdx = 0;
    let nearestRow = cell.closest("tr");
    for (let c of Array.from(nearestRow.querySelectorAll("td"))) {
      if (c == cell) break;
      cellIdx += c.colSpan;
    }

    let cell_data = {
      // 'rowspan': cell.rowSpan,
      // 'colspan': cell.colSpan,
      rowspan: Math.min(cell.rowSpan, rows - 1),
      colspan: Math.min(cell.colSpan, cols - 1),
      row: Math.max(nearestRow.rowIndex - delta_row, 0),
      col: Math.max(cellIdx - delta_col, 0),
    };
    merge_data.push(cell_data);
  }
  return { mergeCells: merge_data };
};

WordParser.prototype.unmarkSelection = function (elements = null, word = "") {
  if (!elements) return;
  const dom_ids = elements.split(",");
  dom_ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      const parent_element = element.parentElement;
      if (parent_element) {
        parent_element.innerHTML = parent_element.textContent;
      }
    }
  });
};

WordParser.prototype.exportData = function (doc_id, template_name) {
  let export_data = {
    Document_id: doc_id,
    name: template_name,
    sections: [],
  };

  let export_data_promise = new Promise((resolve, reject) => {
    let marked_items = Array.from(
      document.getElementById(this.word_div).querySelectorAll("[elem_type]")
    );
    let grid_title = null;
    let grid_title_elem_id = null;
    let grid_title_elem_ind = null;

    let section_obj = {
      text: "Default Category",
      is_truncated: false,
      subSections: [],
    };

    let sub_section_obj = {
      text: "Default Sub Category",
      is_truncated: false,
      questions: [],
    };
    let prevQuestionText = "";
    let parentQuestionInstructions = "";
    let last_executed_type_question = false;

    for (let [ind, item] of marked_items.entries()) {
      let text = item.getAttribute("elem_text");
      // For elements which are marked by selecting the text
      if (item.tagName == "PARSER") {
        text = this.getSelectedWithInheritedStyle(item, true);
      }

      let next_item = marked_items[ind + 1];
      if (!text && item.tagName != "TABLE") continue;
      let type = item.getAttribute("elem_type");
      if (item.getAttribute(ParserElementAttributes.IS_PARENT)) {
        text += this.getAssociatedElementsText(item.getAttribute("id"), type);
      }

      if (item.getAttribute(ParserElementAttributes.ASSOCIATED_TO)) continue;

      if (type == ParserElementType.SECTION) {
        if (sub_section_obj.questions.length > 0) {
          let sub_section_obj_copy = JSON.parse(
            JSON.stringify(sub_section_obj)
          );
          section_obj.subSections.push(sub_section_obj_copy);
        }

        if (section_obj.subSections.length > 0) {
          delete section_obj["category_instructions"];
          let section_obj_copy = JSON.parse(JSON.stringify(section_obj));
          export_data.sections.push(section_obj_copy);
        }

        let [section_text, truncated_flag] = this.truncateText(text, 150);

        section_obj.text = section_text;
        section_obj.is_truncated = truncated_flag;
        section_obj.subSections = [];

        sub_section_obj.text = section_text;
        sub_section_obj.is_truncated = truncated_flag;
        sub_section_obj.questions = [];
        sub_section_obj.instructions = this.getInstructionsAssociatedToElement(
          item.id,
          ind + 1,
          marked_items
        );
        sub_section_obj.category_instructions =
          this.getInstructionsAssociatedToElement(
            item.id,
            ind + 1,
            marked_items
          );
      } else if (type == ParserElementType.SUB_SECTION) {
        if (sub_section_obj.questions.length > 0) {
          let sub_section_obj_copy = JSON.parse(
            JSON.stringify(sub_section_obj)
          );
          section_obj.subSections.push(sub_section_obj_copy);
        }

        let [section_text, truncated_flag] = this.truncateText(text, 150);

        sub_section_obj.text = section_text;
        sub_section_obj.is_truncated = truncated_flag;
        sub_section_obj.questions = [];

        const associatedInstructions = this.getInstructionsAssociatedToElement(
          item.getAttribute("id"),
          ind + 1,
          marked_items
        );
        sub_section_obj.instructions =
          sub_section_obj.category_instructions + associatedInstructions;
      } else if (
        type == ParserElementType.QUESTION ||
        type == ParserElementType.SUB_QUESTION
      ) {
        let prevQuestionResponse = "";
        if (type == ParserElementType.SUB_QUESTION) {
          if (last_executed_type_question) {
            let prevQuestion = sub_section_obj.questions.pop();
            prevQuestionResponse = prevQuestion.responseHTML;
            // parentQuestionInstructions = prevQuestion.instructions + (prevQuestion.instructions.length > 0 ? "<br />" : "");
            parentQuestionInstructions = prevQuestion.instructions;
          }
          text = prevQuestionText + "\n\t" + text;
          last_executed_type_question = false;
        } else {
          prevQuestionText = text;
          parentQuestionInstructions = "";
          last_executed_type_question = true;
        }

        const questionId = item.getAttribute("id");
        if (item.getAttribute(ParserElementAttributes.IS_PARENT)) {
          // text += this.getAssociatedElementsText(questionId);
          last_executed_type_question = false;
        }

        let question_obj = {
          text: text,
          temp_id: crypto.randomUUID(),
          responseType: "TextMultiLine",
          responseTypeDesc: "Text Explanation - Paragraph",
          responseTypeInt: ParserResponseType.TextMultiLine,
          responseHTML: "",
          commentHTML: "",
          is_selected: true,
          // 'is_truncated': truncated_flag,
          response_coordinates: null,
          comment_coordinates: null,
          response_paragraph_ids: null,
          has_subquestion: type == ParserElementType.SUB_QUESTION,
        };

        let responseHTML = "",
          commentHTML = "";
        let responseParagraphIds = [];

        if (item.tagName == "TD") {
          let current_row = this.getTagParent(item, "TR");
          let row_cells = Array.from(current_row.cells);
          let table = this.getTagParent(current_row, "TABLE");

          let table_no = table.getAttribute("table_no");
          let ques_col_no = item.cellIndex;

          let next_row = table.rows[current_row.rowIndex + 1];
          if (next_row) {
            row_cells = row_cells.concat(Array.from(next_row.cells));
          }

          for (let i = ques_col_no + 1; i < row_cells.length; i++) {
            let cell_type = row_cells[i].getAttribute("elem_type");
            if (
              question_obj.response_coordinates &&
              question_obj.comment_coordinates
            )
              break;

            if (
              question_obj.response_coordinates == null &&
              cell_type == ParserElementType.ANSWER
            ) {
              if (
                row_cells[i].hasAttribute(ParserElementAttributes.CELL_COORDS)
              ) {
                let coordinates = row_cells[i].getAttribute(
                  ParserElementAttributes.CELL_COORDS
                );
                question_obj.response_coordinates = `0,${coordinates.slice(
                  1,
                  -1
                )}`;
              }

              if (this.parser_type == ParserType.QA_WORD_UPLOAD) {
                responseHTML = row_cells[i].innerHTML;
              }
            } else if (
              question_obj.comment_coordinates == null &&
              cell_type == ParserElementType.COMMENT
            ) {
              question_obj.comment_coordinates = `0,${table_no},${
                row_cells[i].closest("tr").rowIndex
              },${row_cells[i].cellIndex}`;

              if (this.parser_type == ParserType.QA_WORD_UPLOAD) {
                commentHTML = row_cells[i].innerHTML;
              }
            }
          }
          // } else if (this.parser_type == ParserType.QA_WORD_UPLOAD && next_item) {
        } else if (next_item) {
          [responseHTML, responseParagraphIds] = this.getAnswerForElement(
            item.id,
            marked_items,
            ind + 1
          );
          if (item.getAttribute(ParserElementAttributes.IS_PARENT)) {
            const associatedQuestions = document.querySelectorAll(
              `[elem_type="${ParserElementType.QUESTION}"][${ParserElementAttributes.ASSOCIATED_TO}="${questionId}"]`
            );
            for (let associatedQuestion of associatedQuestions) {
              const [currResponseHTML, currResponseParagraphIds] =
                this.getAnswerForElement(associatedQuestion.id, marked_items);
              responseHTML += currResponseHTML;
              responseParagraphIds.push(...currResponseParagraphIds);
            }
          }
        }
        // Adds the responses from parent question (if any) for associated questions and sub-questions
        question_obj.responseHTML =
          prevQuestionResponse + this.processHTMLContent(responseHTML);
        question_obj.commentHTML = commentHTML;
        question_obj.instructions = parentQuestionInstructions;
        question_obj.response_paragraph_ids = responseParagraphIds;

        const associatedInstructions = this.getInstructionsAssociatedToElement(
          item.getAttribute("id"),
          ind + 1,
          marked_items
        );
        question_obj.instructions += associatedInstructions;

        sub_section_obj.questions.push(question_obj);
      } else if (type == ParserElementType.GRID_TITLE) {
        grid_title = text;
        grid_title_elem_id = item.id;
        grid_title_elem_ind = ind;
      } else if (
        (type == ParserElementType.GRID ||
          type == ParserElementType.DYNAMIC_GRID) &&
        item.tagName == "TABLE"
      ) {
        let question_text = "Grid Question",
          truncated_flag = false;

        let associatedInstructions;
        if (grid_title) {
          question_text = grid_title;
          grid_title = null;
          associatedInstructions = this.getInstructionsAssociatedToElement(
            grid_title_elem_id,
            grid_title_elem_ind + 1,
            marked_items
          );
        }

        [question_text, truncated_flag] = this.truncateText(question_text, 500);
        let has_merged_cells = item.getAttribute("merge_cells_present");

        if (has_merged_cells && type == ParserElementType.DYNAMIC_GRID) {
          continue;
        }

        let response_type, response_type_int, dynamic_element;
        if (type == ParserElementType.GRID) {
          response_type_int = ParserResponseType.Grid;
          response_type = "Grid";
          dynamic_element = null;
        } else {
          response_type_int = ParserResponseType.DynamicGrid;
          response_type = "DynamicGrid";
          dynamic_element = "Row";
        }

        const headings = this.getRowColumnHeadings(item, type);
        const row_headings = headings["row_headers"];
        const column_headings = headings["column_headers"];
        const start_row = headings["start_row"];
        const start_col = headings["start_col"];
        const table_id = item.getAttribute("table-id")?.replace("table_", "");
        const table_no = table_id ?? item.getAttribute("table_no");

        let question_obj = {
          text: question_text,
          temp_id: crypto.randomUUID(),
          is_selected: true,
          is_truncated: truncated_flag,
          responseType: response_type,
          responseTypeDesc: response_type,
          responseTypeInt: response_type_int,
          response_coordinates: `1,${table_no},${start_row},${start_col}`,
          grid: {
            dataType: "Integer",
            dynamic_element: dynamic_element,
            rows_columns: [],
            metadata: this.getGridMetadata(
              item,
              headings.start_row,
              headings.start_col
            ),
          },
        };

        if (type == ParserElementType.GRID) {
          for (let [ind, rh] of row_headings.entries()) {
            let row_object = {
              name: rh,
              elementType: "Row",
              order: ind + 1,
            };
            question_obj.grid.rows_columns.push(row_object);
          }
        }

        for (let [ind, ch] of column_headings.entries()) {
          let column_object = {
            name: ch,
            elementType: "Column",
            order: ind + 1,
            type: "text",
            type_options: {
              type: "text",
            },
          };
          question_obj.grid.rows_columns.push(column_object);
        }

        if (associatedInstructions)
          question_obj.instructions = associatedInstructions;

        sub_section_obj.questions.push(question_obj);
      }
    }
    if (sub_section_obj.questions.length > 0) {
      section_obj.subSections.push(sub_section_obj);
    }
    if (section_obj.subSections.length > 0) {
      delete section_obj["category_instructions"];
      export_data.sections.push(section_obj);
    }

    export_data["metadata"] = this.getMarkedElementStyles();
    export_data["marked_paragraph_ids"] =
      this.getMarkedElementsId(marked_items);

    resolve("Success");
  });

  let res;
  export_data_promise.then(
    function (value) {
      res = value;
    },
    function (error) {
      console.error(error);
      console.error("Error while exporting data");
    }
  );
  return export_data;
};

WordParser.prototype.getAnswerForElement = function (
  elem_id,
  marked_items,
  ind = null
) {
  let responseHTML = "";
  let qa_answer_items = [];
  if (!ind) {
    for (const [i, item] of marked_items.entries()) {
      if (item.id == elem_id) {
        ind = i + 1;
        break;
      }
    }
  }
  if (!ind || ind >= marked_items.length) return responseHTML;

  marked_items = marked_items.slice(ind);
  for (const item of marked_items) {
    const elem_type = item.getAttribute("elem_type");
    // Skip instruction markings while checking for answer elements
    if (elem_type == ParserElementType.INSTRUCTION) continue;
    if (elem_type != ParserElementType.QA_ANSWER) break;
    qa_answer_items.push(item);
  }

  // Trimming empty tags in the beginning and in the end
  while (qa_answer_items.length) {
    let answer_item = qa_answer_items[0];
    if (!this.isTagEmpty(answer_item)) {
      break;
    }
    qa_answer_items.shift();
  }

  while (qa_answer_items.length) {
    let answer_item = qa_answer_items[qa_answer_items.length - 1];
    if (!this.isTagEmpty(answer_item)) {
      break;
    }
    qa_answer_items.pop();
  }

  const reponseParagraphIds = [];
  for (let item of qa_answer_items) {
    if (item.tagName == "PARSER") {
      responseHTML += this.getSelectedWithInheritedStyle(item);
    } else {
      responseHTML += item.outerHTML;
    }
    if (item.tagName == "TABLE") {
      reponseParagraphIds.push(item.getAttribute("table-id"));
      Array.from(item.getElementsByTagName("table"))?.forEach((table) => {
        reponseParagraphIds.push(table.getAttribute("table-id"));
      });
    } else {
      reponseParagraphIds.push(item.getAttribute("para-id"));
    }
  }
  return [responseHTML, reponseParagraphIds];
};

WordParser.prototype.getInstructionsAssociatedToElement = function (
  id,
  index,
  marked_items
) {
  let instructionHTML = "";
  const instructionElements = [];
  let considerUnassociatedInstructions = true;

  for (const [ind, item] of marked_items.entries()) {
    const elem_type = item.getAttribute("elem_type");
    if (
      ind >= index &&
      [
        ParserElementType.SECTION,
        ParserElementType.SUB_SECTION,
        ParserElementType.QUESTION,
        ParserElementType.SUB_QUESTION,
      ].indexOf(elem_type) > 0 &&
      item.getAttribute(ParserElementAttributes.ASSOCIATED_TO) != id
    )
      considerUnassociatedInstructions = false;

    if (
      elem_type == ParserElementType.INSTRUCTION &&
      (item.getAttribute(ParserElementAttributes.ASSOCIATED_TO) == id ||
        (considerUnassociatedInstructions &&
          ind >= index &&
          !item.hasAttribute(ParserElementAttributes.ASSOCIATED_TO)))
    ) {
      instructionElements.push(item);
    }
  }

  if (instructionElements.length > 0) {
    instructionElements.forEach((item) => {
      if (item.tagName == "PARSER") {
        instructionHTML += this.getSelectedWithInheritedStyle(item);
      } else {
        const clone = item.cloneNode();
        clone.removeAttribute("elem_type");
        clone.innerHTML = item.innerHTML.trim();
        // instructionHTML += clone.outerHTML.trim() + "<br />";
        instructionHTML += clone.outerHTML.trim();
      }
    });
  }

  return instructionHTML;
};

WordParser.prototype.getAssociatedQuestionsText = function (id) {
  const subQuestionElements = document.querySelectorAll(
    `[elem_type="${ParserElementType.QUESTION}"][${ParserElementAttributes.ASSOCIATED_TO}="${id}"]`
  );
  let subQuestionElementsText = "";
  subQuestionElements.forEach((element) => {
    subQuestionElementsText += " " + element.textContent.trim();
  });
  return subQuestionElementsText;
};

WordParser.prototype.getAssociatedElementsText = function (id, elem_type) {
  const associatedElements = document.querySelectorAll(
    `[elem_type="${elem_type}"][${ParserElementAttributes.ASSOCIATED_TO}="${id}"]`
  );
  let associatedElementsText = "";
  associatedElements.forEach((element) => {
    associatedElementsText += "\n\t" + element.textContent.trim();
  });
  return associatedElementsText;
};

WordParser.prototype.getMarkingState = function () {
  let marked_items = document
    .getElementById(this.word_div)
    .querySelectorAll("[elem_type]:not(qa_answer)");
  let marking_state = {};
  for (let item of marked_items) {
    let elem_type = item.getAttribute("elem_type");
    let id = item.id;
    let attrs = {};
    attrs[ParserElementAttributes.ASSOCIATED_TO] = item.getAttribute(
      ParserElementAttributes.ASSOCIATED_TO
    );
    attrs[ParserElementAttributes.IS_PARENT] = item.getAttribute(
      ParserElementAttributes.IS_PARENT
    );

    if (!(elem_type in marking_state)) marking_state[elem_type] = [];
    marking_state[elem_type].push([id, attrs]);
  }
  return marking_state;
};

WordParser.prototype.setMarkingState = function (marking_state) {
  this.resetFile(false, false);
  for (let elem_type in marking_state) {
    let elem_ids = marking_state[elem_type];
    for (const [id, attrs] of elem_ids) {
      const elem = document.getElementById(id);
      if (elem.tagName == "PARSER") {
        this.setSlectionType(elem, ParserSelectionType.SELECT, elem_type);
      } else {
        elem.setAttribute("elem_type", elem_type);
        for (const [key, value] of Object.entries(attrs)) {
          if (!value || value == "null") {
            elem.removeAttribute(key);
          } else {
            elem.setAttribute(key, value);
          }
        }
      }
    }
  }
};

WordParser.prototype.addUndoState = function (reset_redo = true) {
  let undo_state = this.getMarkingState();
  this.undo_states.push(undo_state);
  if (reset_redo) {
    this.redo_states = [];
  }
};

WordParser.prototype.addRedoState = function () {
  let redo_state = this.getMarkingState();
  this.redo_states.push(redo_state);
};

WordParser.prototype.executeUndo = function () {
  return new Promise((resolve, reject) => {
    if (!this.undo_states.length) {
      reject("No undo states exists");
    } else {
      let undo_state = this.undo_states.pop();
      this.addRedoState();
      this.setMarkingState(undo_state);
      resolve("Success");
    }
  });
};

WordParser.prototype.executeRedo = function () {
  return new Promise((resolve, reject) => {
    if (!this.redo_states.length) {
      reject("No redo states available");
    } else {
      let redo_state = this.redo_states.pop();
      this.addUndoState(false);
      this.setMarkingState(redo_state);
      resolve("Success");
    }
  });
};

WordParser.prototype.markOrUnmarkTextOrTableTag = function (
  tag,
  operation,
  elem_type,
  add_undo_state
) {
  if (tag.tagName == "TD" || tag.hasAttribute("has_td")) {
    this.markOrUnmarkTableTags(tag, operation, elem_type, add_undo_state);
    // let containsTableElements = true;
  } else {
    this.markOrUnmarkTextTags(tag, operation, elem_type, add_undo_state);
  }
};

WordParser.prototype.getParentForSelection = function (tag) {
  let target = tag;
  while (target && target.tagName == "PARSER" && target.className.length == 0) {
    target = target.parentElement;
  }
  if (target.tagName == "PARSER" && target.className.length > 0) tag = target;

  if (tag.tagName == "PARSER" && tag.className.length > 0) {
    const linked_id = tag.getAttribute("parent_element_id");
    const head = document.querySelector(`[start${linked_id}]`);
    return head || tag;
  } else if (tag.tagName == "TD" || tag.hasAttribute("has_td")) {
    return this.getTagParent(tag, "TD");
  }
  return this.getTagParent(tag);
};

WordParser.prototype.getTableOrTextParent = function (tag) {
  let target = tag;
  while (target && target.tagName == "PARSER" && target.className.length == 0) {
    target = target.parentElement;
  }
  if (target.tagName == "PARSER" && target.className.length > 0) tag = target;

  if (tag.tagName == "PARSER" && tag.className.length > 0) {
    const linked_id = tag.getAttribute("parent_element_id");
    const head = document.querySelector(`[start${linked_id}]`);
    return head || tag;
  } else if (tag.tagName == "TD" || tag.hasAttribute("has_td")) {
    return this.getTagParent(tag, "TABLE");
  }
  return this.getTagParent(tag);
};

WordParser.prototype.markOrUnmarkSelectedIds = function (
  selectedIds,
  operation,
  elem_type
) {
  if (selectedIds.size == 0) return [false, false];

  let containsTableElements = false;
  this.addUndoState();
  for (const id of selectedIds) {
    let tag = document.getElementById(id);
    if (tag) {
      this.markOrUnmarkTextOrTableTag(tag, operation, elem_type, false);
      this.unHighlightElement(tag);
    }
  }
  return [true, containsTableElements];
};

WordParser.prototype.highlightElement = function (element) {
  if (element && element.tagName == "PARSER") {
    const linked_id = element.getAttribute("parent_element_id");
    const higlightedElements = Array.from(
      document.querySelectorAll(`[parent_element_id='${linked_id}']`)
    );
    higlightedElements.map((item) => {
      item.classList.add("ctrl-parser-select");
    });
  } else {
    element?.classList.add("ctrl-select");
  }
};

WordParser.prototype.unHighlightElement = function (element) {
  if (element && element.tagName == "PARSER") {
    const linked_id = element.getAttribute("parent_element_id");
    const higlightedElements = Array.from(
      document.querySelectorAll(`[parent_element_id='${linked_id}']`)
    );
    higlightedElements.map((item) => {
      item.classList.remove("ctrl-parser-select");
    });
  } else {
    element?.classList.remove("ctrl-select");
  }
};

WordParser.prototype.unHighlightCtrlHoverElement = function (element) {
  if (element && element.tagName == "PARSER") {
    const linked_id = element.getAttribute("parent_element_id");
    const higlightedElements = Array.from(
      document.querySelectorAll(`[parent_element_id='${linked_id}']`)
    );
    higlightedElements.map((item) => {
      item.classList.remove("ctrl-hover-parser-select");
    });
  } else {
    element?.classList.remove("ctrl-hover-select");
  }
};

WordParser.prototype.highlightCtrlHoverElement = function (element) {
  if (element && element.tagName == "PARSER") {
    const linked_id = element.getAttribute("parent_element_id");
    const higlightedElements = Array.from(
      document.querySelectorAll(`[parent_element_id='${linked_id}']`)
    );
    higlightedElements.map((item) => {
      item.classList.add("ctrl-hover-parser-select");
    });
  } else {
    element?.classList.add("ctrl-hover-select");
  }
};

// Checks if there is a question/sub-section/section tag along with instruction tags
WordParser.prototype.checkForInstructionAssociativity = function (selectedIds) {
  if (selectedIds.size < 2) return false;

  let questionsCount = 0,
    sectionsCount = 0,
    subSectionsCount = 0,
    instructionsCount = 0;
  for (const id of selectedIds) {
    let tag = document.getElementById(id);
    if (!tag) return false;
    const elem_type = tag.getAttribute("elem_type");
    if (
      tag.hasAttribute(ParserElementAttributes.ASSOCIATED_TO) &&
      elem_type != ParserElementType.INSTRUCTION
    )
      return false;
    if (
      elem_type == ParserElementType.QUESTION ||
      elem_type == ParserElementType.SUB_QUESTION ||
      elem_type == ParserElementType.GRID_TITLE
    ) {
      questionsCount++;
    } else if (elem_type == ParserElementType.INSTRUCTION) {
      instructionsCount++;
    } else if (elem_type == ParserElementType.SUB_SECTION) {
      subSectionsCount++;
    } else if (elem_type == ParserElementType.SECTION) {
      sectionsCount++;
    } else {
      return false;
    }

    if (sectionsCount > 1 || subSectionsCount > 1 || questionsCount > 1)
      return false;
  }
  return (
    sectionsCount + subSectionsCount + questionsCount == 1 &&
    instructionsCount > 0
  );
};

WordParser.prototype.associateInstructions = function (selectedIds) {
  this.addUndoState();
  let associationId;
  for (const id of selectedIds) {
    let tag = document.getElementById(id);
    const elem_type = tag.getAttribute("elem_type");
    if (
      (elem_type == ParserElementType.QUESTION &&
        !tag.hasAttribute(ParserElementAttributes.ASSOCIATED_TO)) ||
      elem_type == ParserElementType.SECTION ||
      elem_type == ParserElementType.SUB_SECTION ||
      elem_type == ParserElementType.SUB_QUESTION ||
      elem_type == ParserElementType.GRID_TITLE
    ) {
      associationId = tag.getAttribute("id");
      break;
    }
  }
  if (!associationId) return;
  selectedIds.forEach((id) => {
    let tag = document.getElementById(id);
    this.unHighlightElement(tag);
    if (tag.getAttribute("elem_type") == ParserElementType.INSTRUCTION) {
      tag.setAttribute(ParserElementAttributes.ASSOCIATED_TO, associationId);
    }
  });
  return true;
};

// Checks if there is a only 1 question along with multiple sub-questions
WordParser.prototype.checkForQuestionsAssociativity = function (selectedIds) {
  selectedIds.forEach((id) => {
    let tag = document.getElementById(id);
    if (!tag) return false;
    if (tag.getAttribute("elem_type")) {
      return false;
    }
  });
  return true;
};

function sortingFn(a, b) {
  a = parseInt(a.split("_")[1]);
  b = parseInt(b.split("_")[1]);
  return a - b;
}

WordParser.prototype.associateEntities = function (selectedIds, entityType) {
  this.addUndoState();
  // Mark the id with smallest number as parent and remaining as associated entities
  let sorted_ids = Array.from(selectedIds).sort(sortingFn);
  let associationId = sorted_ids[0];
  sorted_ids.forEach((id) => {
    let tag = document.getElementById(id);
    this.markOrUnmarkTextOrTableTag(
      tag,
      ParserSelectionType.SELECT,
      entityType,
      false
    );
    this.unHighlightElement(tag);
    if (id == associationId) {
      tag.setAttribute(ParserElementAttributes.IS_PARENT, true);
      tag.removeAttribute(ParserElementAttributes.ASSOCIATED_TO);
    } else {
      tag.setAttribute(ParserElementAttributes.ASSOCIATED_TO, associationId);
      tag.removeAttribute(ParserElementAttributes.IS_PARENT);
    }
  });
  return true;
};

WordParser.prototype.markSubQuestions = function (selectedIds) {
  this.addUndoState();
  // Mark the id with smallest number as parent and remaining as associated entities
  let sorted_ids = Array.from(selectedIds).sort(sortingFn);
  let associationId = sorted_ids[0];
  sorted_ids.forEach((id) => {
    let tag = document.getElementById(id);
    this.setTypeAttribute([tag], null, ParserSelectionType.DESELECT);
    if (id == associationId) {
      this.markOrUnmarkTextOrTableTag(
        tag,
        ParserSelectionType.SELECT,
        ParserElementType.QUESTION,
        false
      );
    } else {
      this.markOrUnmarkTextOrTableTag(
        tag,
        ParserSelectionType.SELECT,
        ParserElementType.SUB_QUESTION,
        false
      );
    }
    this.unHighlightElement(tag);
  });
  return true;
};

WordParser.prototype.isSelectionTextMarkable = function () {
  const selection = window.getSelection();
  if (selection.toString().length == 0) return false;
  const range = selection.getRangeAt(0);
  let curr = range.startContainer;
  const end = range.endContainer;
  let MAX_ITR = 0;
  // Checks if the highlighted text has any marked elements or tables
  while (curr && MAX_ITR < 10000) {
    while (curr.nodeType != Node.TEXT_NODE && curr.hasChildNodes()) {
      curr = curr.childNodes[0];
    }

    if (curr == end) {
      break;
    }

    while (curr && !curr.nextSibling) {
      curr = curr.parentElement;
      if (
        (curr.tagName == "PARSER" && curr.className.length > 0) ||
        curr.getAttribute("elem_type") ||
        this.isTagInsideTable(curr)
      ) {
        return false;
      }
    }
    curr = curr?.nextSibling;
    MAX_ITR++;
  }
  return !this.getTagParent(end).hasAttribute("elem_type");
};

// Iterates through the text nodes of the selected text and wraps it arround the PARSRE tag.
WordParser.prototype.markWindowSelection = function (elem_type) {
  this.addUndoState();

  const range = window.getSelection().getRangeAt(0);
  let start = range.startContainer;
  const end = range.endContainer;

  const parent = this.getTagParent(start);
  const unique_id =
    parent.id + Date.now().toString(36) + Math.random().toString(36).substr(2);

  let curr = start;
  let currOffest = range.startOffset;
  let endOffset = 0;
  let MAX_ITR = 0;
  while (MAX_ITR < 10000) {
    if (curr.contains(end) || curr.nodeType != Node.TEXT_NODE) {
      while (curr.nodeType != Node.TEXT_NODE && curr.hasChildNodes()) {
        curr = curr.childNodes[0];
      }
      if (curr == end) {
        endOffset = range.endOffset;
      }
    }

    let localRange = new Range();
    localRange.setStart(curr, currOffest);
    localRange.setEnd(curr, endOffset || curr.length);

    let newNode = document.createElement("parser");
    // To change the background color depending on the elem_type
    newNode.classList.add("elem_type-" + elem_type);
    newNode.id =
      "text_" + Date.now().toString(36) + Math.random().toString(36).substr(2);
    newNode.setAttribute("parent_element_id", unique_id);
    if (MAX_ITR == 0) {
      newNode.setAttribute("elem_type", elem_type);
      start = newNode;
    }

    currOffest = 0;
    if (curr == end) {
      start.setAttribute("start" + unique_id, "true");
      start.setAttribute("last_selection_id", newNode.id);
      localRange.surroundContents(newNode);
      break;
    }

    while (!curr.nextSibling) {
      curr = curr.parentElement;
    }
    curr = curr.nextSibling;
    localRange.surroundContents(newNode);
    MAX_ITR++;
  }
  window.getSelection().removeAllRanges();
};

// Changes the type for elements marked by selecting the text
WordParser.prototype.setSlectionType = function (tag, operation, elem_type) {
  let parser_elem = tag;
  if (tag.tagName != "PARSER") {
    parser_elem = tag.querySelector("parser");
  }
  const linked_id = parser_elem.getAttribute("parent_element_id");
  const linked_elems = document.querySelectorAll(
    `[parent_element_id="${linked_id}"]`
  );
  for (const elem of linked_elems) {
    elem.classList.value = "";
    if (operation == ParserSelectionType.SELECT) {
      elem.classList.add("elem_type-" + elem_type);
      if (elem.hasAttribute("start" + linked_id))
        elem.setAttribute("elem_type", elem_type);
    } else {
      elem.removeAttribute("elem_type", elem_type);
    }
  }
};

WordParser.prototype.getSelectedWithInheritedStyle = function (
  head,
  onlyText = false
) {
  const linked_id = head.getAttribute("parent_element_id");
  const linked_elems = document.querySelectorAll(
    `[parent_element_id="${linked_id}"]`
  );
  let parent_elem_map = {};
  let text = "";
  const parent_ids = [];
  // const elem_type = head.getAttribute('elem_type');

  // selection marking can start from the middle of a node, in order to get all style attributes of the parent and grand parent, elements are grouped by the grand parent tag
  // Generally grand parent tags to the parser tags are P, H1, H2, H3, H4, H5, H6 and parent tags will be span tags.
  for (const elem of linked_elems) {
    if (elem.textContent.length == 0) continue;

    const span = this.getTagParent(elem, "SPAN");
    const parent = this.getTagParent(span);

    if (!parent) continue;

    if (!onlyText) {
      const clone = span.cloneNode();
      clone.innerHTML = elem.innerHTML;
      text = clone.outerHTML;
    } else {
      text = elem.textContent;
    }

    if (!(parent.id in parent_elem_map)) {
      parent_elem_map[parent.id] = [];
      parent_ids.push(parent.id);
    }
    parent_elem_map[parent.id].push(text);
  }

  const textArr = [];

  for (const parent_id of parent_ids) {
    const t = parent_elem_map[parent_id].join("").trim();
    if (!onlyText) {
      const parent = document.getElementById(parent_id);
      const clone = parent.cloneNode();
      clone.innerHTML = t;
      // text += clone.outerHTML.trim();
      textArr.push(clone.outerHTML.trim());
      // if (elem_type == ParserElementType.INSTRUCTION) {
      //     text += '<br />';
      // }
    } else {
      // text += t + "\n";
      textArr.push(t + "\n");
    }
  }
  return this.trimSentences(textArr).reduce((text, t) => text + t, "");
};

WordParser.prototype.trimSentences = function (arr) {
  while (arr.length) {
    const div = document.createElement("div");
    div.innerHTML = arr[0];
    let item = div.textContent;

    if (item.trim() != "") break;
    arr.shift();
  }

  while (arr.length) {
    const div = document.createElement("div");
    div.innerHTML = arr[arr.length - 1];
    let item = div.textContent;

    if (item.trim() != "") break;
    arr.pop();
  }

  return arr;
};

WordParser.prototype.removeAssociations = function (tag) {
  const associations = document
    .getElementById(this.word_div)
    .querySelectorAll(`[${ParserElementAttributes.ASSOCIATED_TO}=${tag.id}]`);
  for (const elem of associations) {
    elem.removeAttribute(ParserElementAttributes.ASSOCIATED_TO);
  }
};

WordParser.prototype.checkUnmarkableCells = function () {
  const tdCells = document.getElementById(this.word_div).querySelectorAll("td");
  const unmarkableCells = [];
  for (const cell of tdCells) {
    if (
      !cell.hasAttribute(ParserElementAttributes.CELL_COORDS) &&
      cell.innerHTML.length > 0
    ) {
      unmarkableCells.push(cell);
    }
  }
  return unmarkableCells;
};

WordParser.prototype.highlightUnmarkableCells = function (unmarkableCells) {
  for (const cell of unmarkableCells) {
    cell.setAttribute("disabled", true);
    cell.classList.add("error-table-cell");
  }
  return unmarkableCells;
};

WordParser.prototype.getMarkedElementStyles = function () {
  const markedElements = document
    .getElementById(this.word_div)
    .querySelectorAll(`[elem_type]`);
  const styleMap = {};
  markedElements.forEach((item) => {
    const elem_type = item.getAttribute("elem_type");
    if (!styleMap[elem_type]) styleMap[elem_type] = [];

    let style = `${item.tagName}[elem_style="${item.getAttribute(
      "elem_style"
    )}"][elem_indent="${item.getAttribute("elem_indent")}"]`;
    let subStyles = Array.from(
      new Set(
        Array.from(item.querySelectorAll(":scope > span")).map((spanItem) => {
          return `${spanItem.tagName}[elem_style="${spanItem.getAttribute(
            "elem_style"
          )}"]`;
        })
      )
    );

    let selector_string = style;
    subStyles.forEach((substyle) => {
      selector_string += `:has(${substyle})`;
    });
    styleMap[elem_type].push(selector_string);
  });
  for (const [type, styles] of Object.entries(styleMap)) {
    styleMap[type] = Array.from(new Set(styles));
  }
  return styleMap;
};

WordParser.prototype.setMarkedElementStyles = function (styles) {
  let foundSimilarElements = false;
  this.addUndoState();
  this.resetFile();
  for (const [type, elemStyles] of Object.entries(styles || {})) {
    if (type == ParserElementType.QA_ANSWER) continue;

    for (const style of elemStyles) {
      const similar_elements = Array.from(
        document.querySelectorAll(style)
      ).filter((item) => item.hasAttribute("elem_text"));
      if (similar_elements.length > 0) foundSimilarElements = true;
      this.setTypeAttribute(
        similar_elements,
        null,
        ParserSelectionType.SELECT,
        type
      );
    }
  }
  if (!foundSimilarElements) {
    this.undo_states.pop();
  } else {
    this.pruneMarkingsFromSimilarDoc();
  }
  return foundSimilarElements;
};

WordParser.prototype.pruneMarkingsFromSimilarDoc = function () {
  // When traversed from bottom to top in markings
  // If consecutive sub-category markings are found then mark the top one as category
  const markedElements = Array.from(
    document.getElementById(this.word_div).querySelectorAll(`[elem_type]`) || []
  );
  let prevMark = null;

  if (
    markedElements.length > 0 &&
    markedElements[0].getAttribute("elem_type") == ParserElementType.SUB_SECTION
  ) {
    markedElements[0].setAttribute("elem_type", ParserElementType.SECTION);
  }

  markedElements.reverse().forEach((item) => {
    const marking = item.getAttribute("elem_type");
    if (
      marking == ParserElementType.SUB_SECTION &&
      prevMark == ParserElementType.SUB_SECTION
    ) {
      item.setAttribute("elem_type", ParserElementType.SECTION);
      prevMark = ParserElementType.SECTION;
    } else {
      prevMark = marking;
    }
  });
};

WordParser.prototype.getMarkedElementsId = function (markedElements) {
  const markedElementsId = [];
  markedElements.forEach((item) => {
    if (
      [ParserElementType.QA_ANSWER, ParserElementType.ANSWER].indexOf(
        item.getAttribute("elem_type")
      ) > -1
    )
      return;

    if (
      item.getAttribute("has_td") ||
      item.tagName == "TD" ||
      item.tagName == "TABLE" ||
      [ParserElementType.GRID, ParserElementType.DYNAMIC_GRID].indexOf(
        item.getAttribute("elem_type")
      ) > -1
    ) {
      let table = item.closest("table");
      while (table) {
        const nextTable = table.parentElement?.closest("table");
        if (!nextTable) break;
        table = nextTable;
      }
      if (
        [ParserElementType.GRID, ParserElementType.DYNAMIC_GRID].indexOf(
          table.getAttribute("elem_type")
        ) === -1
      ) {
        markedElementsId.push(table.getAttribute("table-id"));
      }
      Array.from(table.querySelectorAll("table"))?.forEach((table) => {
        if (
          [ParserElementType.GRID, ParserElementType.DYNAMIC_GRID].indexOf(
            table.getAttribute("elem_type")
          ) === -1
        ) {
          markedElementsId.push(table.getAttribute("table-id"));
        }
      });
    } else if (item.getAttribute("para-id")) {
      markedElementsId.push(item.getAttribute("para-id"));
    }
  });
  return Array.from(new Set(markedElementsId));
};
