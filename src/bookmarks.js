import $ from 'jquery';
import api from './bookmarksApi.js';
import store from './bookmarksStore.js';

const ifRating = (val, fallback) => ((val >= 1) && (val <= 5)) ? val : fallback;

const bookmarkIdFrom$Target = $target => $target.closest('li').data('id');

// IMPORTANT -- :indeterminate style only works if these are wrapped by a form
// any call site that isn't naturally inside a form needs to wrap this result w/ <form></form>
const generateRatingEditorHtml = current => `<div class="stars">
  <input name="rating" type="radio" ${(current===1)?'checked ':''}value="1" aria-label="1 Star">
  <input name="rating" type="radio" ${(current===2)?'checked ':''}value="2" aria-label="2 Stars">
  <input name="rating" type="radio" ${(current===3)?'checked ':''}value="3" aria-label="3 Stars">
  <input name="rating" type="radio" ${(current===4)?'checked ':''}value="4" aria-label="4 Stars">
  <input name="rating" type="radio" ${(current===5)?'checked ':''}value="5" aria-label="5 Stars">
  <button class="no-rating" aria-label="No rating" type="button"><span>Reset</span></button>
</div>`;

const generateNewBookmarkFormHtml = expanded => `<form id="new-bookmark-form" class="${expanded?'':'collapsed'}"
  role="dialog" aria-modal="true" aria-labelledby="new-bookmark-form-title"><h2 id="new-bookmark-form-title"
  >Add new bookmark</h2><input id="url" placeholder="http://samplelink.code/toInfinityAndBeyond"><input
  placeholder="Title" id="title">${generateRatingEditorHtml()}<textarea placeholder="Add a description (optional)"
  id="desc"></textarea><input type="reset" id="cancel-add" value="Cancel"><input type="submit" value="Create">
</form>`;

const generateBookmarkHtml = (id, title, url, desc, rating, expanded) => {
  const ratingText = ifRating(rating,'');
  return `<li data-id="${id}" ><h2 class="bookmark"><button aria-controls="expanded-${id}" aria-expanded="${expanded}"
  class="bookmark-header" id="header-${id}"><span class="header-rating" aria-label="${ratingText?ratingText+' stars':''}"
  data-rating="${ratingText}">${ratingText?'★':''}</span>${title}</button></h2><div
  aria-labelledby="header-${id}" id="expanded-${id}" class="bookmark-details ${expanded?'expanded':'collapsed'}"
  ><div><form>${generateRatingEditorHtml(rating)}</form><a href="${url}">Visit Site</a></div><button
  aria-label="Delete bookmark" class="bookmark-killer"
  >X</button><p>${typeof(desc) === 'string' ? desc : ''}</p></div></li>`;
};

const generateBookmarkListHtml = bookmarks => 
  bookmarks.map(b => generateBookmarkHtml(b.id, b.title, b.url, b.desc, b.rating, b.expanded)).join('');

const generateFilterHtml = current => `<select id="filter">
  <option${(current===0)?' selected':''}>No filter</option>
  <option${(current===1)?' selected':''}>1 Star or better</option>
  <option${(current===2)?' selected':''}>2 Star or better</option>
  <option${(current===3)?' selected':''}>3 Star or better</option>
  <option${(current===4)?' selected':''}>4 Star or better</option>
  <option${(current===5)?' selected':''}>5 Star only</option>
</select>`;

const render = () => {
  const minStarRating = store.filter();
  const err = store.error();
  const errText = err ? err : '';
  let bookmarks = store.getAllBookmarks();
  let emptyViewMessage;
  if(minStarRating)
  {
    bookmarks = bookmarks.filter(bookmark => bookmark.rating >= minStarRating);
    emptyViewMessage = '<li><p class="error">None of your bookmarks match the current filter.</p></li>';
  } else {
    emptyViewMessage = `<li><p class="error">You don't have any bookmarks yet. Why not create one?</p></li>`;
  }
  $('main').html(`<div id="controls"><button id="add"><span>+ Add</span></button>${
    generateFilterHtml(store.filter())}</div>${generateNewBookmarkFormHtml(store.adding())}<p
    class="error">${errText}</p><ul>${(bookmarks.length > 0) ? generateBookmarkListHtml(bookmarks) : emptyViewMessage}</ul>`);
  store.error(null);
};

const renderRatingEditor = where => {
  where.replaceWith(generateRatingEditorHtml());
};

const onAddClicked = () => {
  store.adding(!store.adding());
  render();
};

const onAddFormSubmitted = e => {
  e.preventDefault();
  const form = e.target;
  const rating = form.rating.value;
  api.insert(store.encodedUserName(), { title: form.title.value, url: form.url.value, desc: form.desc.value,
    rating: ifRating(rating)})
    .then(bookmark => store.addBookmark(bookmark))
    .then(() => store.adding(false))
    .catch(err => store.error(err))
    .finally(render);
};

const onFilterChanged = e => {
  store.filter(e.target.selectedIndex);
  render();
};

const onHeaderClicked = e => {
  const bookmark = store.findBookmark(bookmarkIdFrom$Target($(e.target)));
  bookmark.expanded = !bookmark.expanded;
  render();
};

const onBookmarkKillerClicked = e => {
  const id = bookmarkIdFrom$Target($(e.target));
  api.delete(store.encodedUserName(), id)
    .then(() => store.deleteBookmark(id))
    .catch(err => store.error(err))
    .finally(render);
};

const onZeroRatingClicked = e => {
  const $target = $(e.target);
  if($target.closest('#new-bookmark-form')) // for the adder, no api calls yet; just re-render the editor
    renderRatingEditor($target.closest('.stars'));
  else { // the api doesn't seem to allow an existing rating to be zeroed; we'll hide this feature with css
/*    const bookmark = store.findBookmark(bookmarkIdFrom$Target($target));
    api.update(store.encodedUserName(), bookmark.id, { rating: 0 })
      .then(() => bookmark.rating = 0)
      .catch(err => store.error(err))
      .finally(render);
*/  }
};

export default {
  init: function(linkedBookmarkId) {
    api.getAll(store.encodedUserName())
      .then(bookmarks => bookmarks.forEach(bookmark => store.addBookmark(bookmark)))
      .then(() => this.expand(linkedBookmarkId))
      .catch(err => store.error(err))
      .finally(render);
    const $bodyElement = $('body');
    $bodyElement.on('click', '#add', onAddClicked);
    $bodyElement.on('input', '#filter', onFilterChanged);
    $bodyElement.on('click', '#cancel-add', onAddClicked);
    $bodyElement.on('submit', '#new-bookmark-form', onAddFormSubmitted);
    $bodyElement.on('click', '.no-rating', onZeroRatingClicked);
    $bodyElement.on('click', '.bookmark-header', onHeaderClicked);
    $bodyElement.on('click', '.bookmark-killer', onBookmarkKillerClicked);
  },

  expand: (linkedBookmarkId) => {
    const linked = store.findBookmark(linkedBookmarkId);
    if(linked) {
      linked.expanded = true;
      render();
    }
  }
};