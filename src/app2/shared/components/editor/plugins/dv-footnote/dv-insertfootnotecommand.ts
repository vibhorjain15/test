import { Command, Editor, Element, Writer } from 'ckeditor5';

export default class DVInsertFootNoteCommand extends Command {
  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const allowedIn = model.schema.findAllowedParent(
      selection.getLastPosition()!,
      'footNote'
    );
    this.isEnabled = allowedIn !== null;
  }

  override execute({ value }: { value: number }): void {
    const doc = this.editor.model.document;
    const selection = doc.selection;

    // Set the selection at the end to prevent selected content
    // getting overridden by the editor.
    if (!selection.isCollapsed) {
      this.editor.model.change((writer) => {
        writer.setSelection(selection.getLastPosition());
      });
    }

    if (
      (doc.getRoot()!.getChild(doc.getRoot()!.maxOffset - 1)! as Element)
        .name !== 'footNote'
    ) {
      this.editor.model.change((writer) => {
        const footNote = createFootNote(writer);

        // Insert noteHolder
        insertNoteHolder(1, writer, this.editor);

        this.editor.model.insertContent(
          footNote,
          writer.createPositionAt(doc.getRoot()!, doc.getRoot()?.maxOffset)
        );

        this.editor.editing.view.focus();
        writer.setSelection(
          footNote.getChild(footNote.maxOffset - 1) as Element,
          'end'
        );
        // this.editor.editing.view.scrollToTheSelection();
      });
    } else {
      if (value !== 0) {
        this.editor.model.change((writer) => {
          const noteHolder = insertNoteHolder(value, writer, this.editor);
          writer.setSelection(noteHolder, 'on');
        });
      } else {
        this.editor.model.change((writer) => {
          const footNote = doc
            .getRoot()
            ?.getChild(doc.getRoot()!.maxOffset - 1) as Element;

          // Add the noteHolder
          const id = footNote!.maxOffset + 1;
          insertNoteHolder(id, writer, this.editor);

          const footNoteList = writer.createElement('footNoteList', {
            'data-id': id,
          });
          const footNoteItem = writer.createElement('footNoteItem', {
            id: id,
          });
          // const p = writer.createElement('paragraph'); // Not appending content to p tag now
          // writer.append(footNoteItem, p);
          // writer.append(p, footNoteList);
          writer.append(footNoteItem, footNoteList);

          this.editor.model.insertContent(
            footNoteList,
            writer.createPositionAt(footNote, footNote.maxOffset)
          );

          this.editor.editing.view.focus();
          writer.setSelection(
            footNote.getChild(footNote.maxOffset - 1) as Element,
            'end'
          );
        });
      }
    }
  }
}

function createFootNote(writer: Writer): Element {
  const footNote = writer.createElement('footNote');
  // const footNoteTitle = writer.createElement('footNoteTitle');
  const footNoteList = writer.createElement('footNoteList', { 'data-id': 1 });
  const footNoteItem = writer.createElement('footNoteItem', { id: 1 });
  // const p = writer.createElement('paragraph'); // Not appending content to p tag now

  // writer.append(footNoteTitle, footNote);
  writer.append(footNoteList, footNote);
  // writer.append(footNoteItem, p);
  // writer.append(p, footNoteList);
  writer.append(footNoteItem, footNoteList);

  // There must be at least one paragraph for the description to be editable.
  // See https://github.com/ckeditor/ckeditor5/issues/1464.
  // writer.appendElement( 'paragraph', footNoteList );

  return footNote;
}

function insertNoteHolder(id: number, writer: Writer, editor: Editor): Element {
  const noteHolder = writer.createElement('noteHolder', { id: id });
  editor.model.insertContent(noteHolder);
  return noteHolder;
}
