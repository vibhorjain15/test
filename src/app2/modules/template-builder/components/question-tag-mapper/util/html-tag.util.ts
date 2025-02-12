export const htmlTagGenerator = (
  type: 'date' | 'dropdown',
  tag,
  options = null
) => {
  if (type === 'date') {
    return `<input type="date" id="${tag}_date" name="${tag}_date">`;
  } else if (type === 'dropdown') {
    let html = `<select name="diligencevault_owner" id="${tag}" chosen> <option value="">--Select--</option> `;
    options.map((val) => {
      html += `<option value="${val}">${val}</option>`;
    });
    html += `</select>`;
    return html;
  }
};
