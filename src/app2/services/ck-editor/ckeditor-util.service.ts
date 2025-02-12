import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

import { Store } from '@ngxs/store';
import { EditorConfig } from 'ckeditor5';

/**
 * The CKEditor Util services.
 */
@Injectable({
  providedIn: 'root',
})
export class CKEditorUtilService {
  readonly tinyMceSampleResponse: string = `Some texts.<span id="#wk_ft1" class="fnoteWrap" contenteditable="false"><sup class="fnoteBtn" title="Footnote sample text 1" data-content="Footnote%20sample%20text%201">1</sup></span>&nbsp;<br />Testing<span id="#wk_ft2" class="fnoteWrap" contenteditable="false"><sup class="fnoteBtn" title="Another footnote" data-content="Another%20footnote">2</sup></span>&nbsp; tinyMCe footnote conversion<br />with CKEditor<span id="#wk_ft3" class="fnoteWrap" contenteditable="false"><sup class="fnoteBtn" title="Yet another footnote" data-content="Yet%20another%20footnote">3</sup></span>&nbsp;.`;
  readonly ckeditorSampleResponse: string = `<p>Some texts.<span class="noteholder" data-footnote-id="1"><sup>[1]</sup></span>&nbsp;<br>Testing<span class="noteholder" data-footnote-id="2"><sup>[2]</sup></span>&nbsp; tinyMCe footnote conversion check<br>with CKEditor<span class="noteholder" data-footnote-id="3"><sup>[3]</sup></span>.</p><section class="footnote"><section class="footnote-list" data-id="1"><span class="footnote-item">1.&nbsp;</span>Footnote sample text 1</section><section class="footnote-list" data-id="2"><span class="footnote-item">2.&nbsp;</span>Another footnote</section><section class="footnote-list" data-id="3"><span class="footnote-item">3.&nbsp;</span>Yet another footnote</section></section>`;

  constructor(
    private readonly store: Store,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  //#region TinyMce to CKEditor Footnote

  /**
   * Checks whether the given response contains TinyMce footnote or not.
   * @param responseText The response text.
   * @returns `true` if it contains footnote. Otherwise, `false`.
   */
  doesResponseContainsTinyMceFootnote(responseText: string): boolean {
    if (!responseText) {
      return false;
    }

    return responseText.includes('class="fnoteWrap"');
  }

  /**
   * Converts the TinyMce footnote to the CKEditor footnote.
   * @param responseText The response text.
   * @returns The converted response.
   */
  convertTinyMceFootnoteToCKEditor(responseText: string): string {
    if (!responseText) {
      return responseText;
    }

    // Container element.
    const div = this.document.createElement('div');
    div.innerHTML = responseText;

    // Get all the TinyMce footnotes.
    const footNotes = div.querySelectorAll('.fnoteWrap');

    // If no footnotes found, then return.
    if (footNotes.length === 0) {
      return responseText;
    }

    const footNoteMap = new Map<string, string>();
    for (let i = 0; i < footNotes.length; i++) {
      const footNote = footNotes[i];
      const footNoteId = footNote.firstChild.textContent;
      const footNoteText = (footNote.firstChild as HTMLElement).title;

      // Store footnotes to add it at the end of response.
      footNoteMap.set(footNoteId, footNoteText);

      // Replace the TinyMce note holder with CKEditor one.
      const newNoteHolder = this.getCKEditorNoteHolder(footNoteId);
      footNote.replaceWith(newNoteHolder);
    }

    // Add the footnote.
    const footnote = this.getCKEditorFootnote(footNoteMap);
    div.append(footnote);

    return div.innerHTML;
  }

  /**
   * Gets the CKEditor footnote.
   * @param footnoteMap The footnotes.
   * @returns The footnote html element.
   */
  private getCKEditorFootnote(footnoteMap: Map<string, string>): HTMLElement {
    const footnotes: Array<{ id: string; value: string }> = [];
    footnoteMap.forEach((value, key) =>
      footnotes.push({ id: key, value: value })
    );

    // Sort the footnotes in ascending order.
    footnotes.sort((a, b) => +a.id - +b.id);

    // Footnote section
    const footNoteSection = this.document.createElement('section');
    footNoteSection.classList.add('footnote');

    footnotes.forEach((footnote) => {
      const footnoteList = this.document.createElement('section');
      footnoteList.classList.add('footnote-list');
      footnoteList.dataset.id = footnote.id;
      footnoteList.innerHTML = `<span class="footnote-item">${footnote.id}.&nbsp;</span>${footnote.value}`;

      footNoteSection.append(footnoteList);
    });

    return footNoteSection;
  }

  /**
   * Gets the ckeditor footnote holder.
   * @param footNoteId The footnote id.
   * @returns The ckeditor foonote holder.
   */
  private getCKEditorNoteHolder(footNoteId: string): HTMLSpanElement {
    const newFootnoteHolder = this.document.createElement('span');
    newFootnoteHolder.classList.add('noteholder');
    newFootnoteHolder.dataset.footnoteId = footNoteId;
    newFootnoteHolder.innerHTML = `<sup>[${footNoteId}]</sup>`;

    return newFootnoteHolder;
  }

  //#endregion

  //#region CKEditor to TinyMce Rootnote

  /**
   * Checks whether the give response contains CKEditor footnote or not.
   * @param responseText The response text.
   * @returns `true` if it contains footnote. Otherwise, `false`.
   */
  doesResponseContainsCKEditorFootnote(responseText: string): boolean {
    if (!responseText) {
      return false;
    }

    return responseText.includes('class="noteholder"');
  }

  /**
   * Converts the CKEditor footnote to the TinyMce footnote.
   * @param responseText The response text.
   * @returns The converted response.
   */
  convertCKEditorFootnoteToTinyMce(responseText: string): string {
    if (!responseText) {
      return responseText;
    }

    // Container element.
    const div = this.document.createElement('div');
    div.innerHTML = responseText;

    // Get footnote data.
    const footnoteData = this.getFootnoteData(div);

    // Get all the footnote holders and replace with TinyMce one.
    const footnoteHolders = div.querySelectorAll('.noteholder');
    for (let i = 0; i < footnoteHolders.length; i++) {
      const footnoteHolder = footnoteHolders[i] as HTMLElement;
      const footnoteId = footnoteHolder.dataset.footnoteId;
      const footnoteText = footnoteData.get(footnoteId);

      const newFootnoteHolder = this.getTinyMceNoteHolder(
        `${i + 1}`,
        footnoteText
      );
      footnoteHolder.replaceWith(newFootnoteHolder);
    }

    // Remove the footnote container.
    const footnoteContainer = div.querySelector('section.footnote');
    footnoteContainer.replaceWith(); // replace with empty node.

    let response = div.innerHTML;
    response = response.replace(/<br>/g, '<br />'); // TinyMce expects <br /> like this, so update it.
    return response;
  }

  /**
   * Gets the footnote data.
   * @param containerElement The HTML container element.
   * @returns The footnote data.
   */
  private getFootnoteData(
    containerElement: HTMLDivElement
  ): Map<string, string> {
    const footnoteData = new Map<string, string>();
    const footnoteContainer =
      containerElement.querySelector('section.footnote');
    const footnotes = footnoteContainer.querySelectorAll('.footnote-list');
    for (let i = 0; i < footnotes.length; i++) {
      const footnote = footnotes[i] as HTMLElement;
      const footnoteId = footnote.dataset.id;
      const footnoteText = footnote.lastChild.textContent;

      if (footnoteId && footnoteText) {
        footnoteData.set(footnoteId, footnoteText);
      }
    }

    return footnoteData;
  }

  /**
   * Gets the TinyMce footnote holder.
   * @param footnoteId The footnote id.
   * @param footnoteText The footnote text.
   * @returns The TinyMce footnote holder.
   */
  private getTinyMceNoteHolder(
    footnoteId: string,
    footnoteText: string
  ): HTMLSpanElement {
    // Sample HTML
    // <span id="#wk_ft1" class="fnoteWrap" contenteditable="false">
    //   <sup class="fnoteBtn" title="Footnote sample text 1" data-content="Footnote%20sample%20text%201">1</sup>
    // </span>
    const newFootnoteHolder = this.document.createElement('span');
    newFootnoteHolder.id = `#wk_ft${footnoteId}`;
    newFootnoteHolder.classList.add('fnoteWrap');
    newFootnoteHolder.contentEditable = 'false';
    newFootnoteHolder.innerHTML = `<sup class="fnoteBtn" title="${footnoteText}" data-content="${encodeURIComponent(
      footnoteText
    )}">${footnoteId}</sup>`;

    return newFootnoteHolder;
  }

  //#endregion

  //#region CKEditor comments panel utilities

  /**
   * Scrolls the specified container element to bottom.
   * @param element The `HTMLElement` to scroll.
   */
  scrollToBottom(element: HTMLElement): void {
    element.scrollTo({
      left: 0,
      top: element.scrollHeight,
      behavior: 'smooth',
    });
  }

  //#endregion

  /**
   * The mention list mapper to map `member/user` data for CKEditor.
   * @param member The `member/user` details.
   * @returns The formatted data which CKEditor can understand.
   */
  mentionListMapper = (member: any): any => {
    return {
      ...member,
      id: `@${member.fullName}`, // Map to data-mention
      mentionId: `${member.id}`, // Map to data-mention-id
      email: member.userName, // Map to data-email
      toggle: member.fullName, // Map to data-toggle
      title: member.fullName, // Map to title
    };
  };

  /**
   * Gets the list of users for ckeditor mention feature.
   * @returns The list of users.
   */
  getUserMentionList(): Array<any> {
    const teamMembers = this.store.selectSnapshot(
      (state) => state.user.teamMembers
    );

    return (
      teamMembers?.map((member: any) => ({
        ...member,
        id: `@${member.fullName}`, // Map to data-mention
        mentionId: `${member.id}`, // Map to data-mention-id
        email: member.userName, // Map to data-email
        toggle: member.fullName, // Map to data-toggle
        title: member.fullName, // Map to title
      })) ?? []
    );
  }

  /**
   * Adds the list of user to ckeditor configuration.
   * @param config The ckeditor configuration.
   */
  addUsers(config: EditorConfig): void {
    const users = this.store.selectSnapshot((state) => state.user.teamMembers);
    if (!users) {
      return;
    }

    const currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );

    config.dvUserConfig = {
      users: users.map((user) => ({ id: user.id, name: user.fullName })),
      currentUserId: currentUser.id,
    };
  }
}
