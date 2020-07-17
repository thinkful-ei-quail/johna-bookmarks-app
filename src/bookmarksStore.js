const Bookmark = function() {
  this.id = null;
  this.title = 'New Bookmark';
  this.url = 'https://';
  this.desc = null;
  this.rating = null;
  this.expanded = false;
};

const store = {
  adding: false,
  bookmarks: [],
  error: null,
  filter: 0,
  user: null,
};

export default {

  assignUser: (encodedUser, decodedUser) => store.user = { encodedUser, decodedUser },
  decodedUserName: () => store.user.decodedUser,
  encodedUserName: () => store.user.encodedUser,
  error: err => err ? (store.error = err) : store.error,

  addBookmark: bookmark => store.bookmarks.unshift(Object.assign(new Bookmark(), bookmark)),
  adding: bool => (bool!==undefined) ? (store.adding = bool) : store.adding,
  deleteBookmark: id => store.bookmarks.splice(store.bookmarks.findIndex(bookmark => bookmark.id === id), 1),
  filter: level => (level!==undefined) ? (store.filter = level) : store.filter,
  findBookmark: id => store.bookmarks.find(bookmark => bookmark.id === id),
  getAllBookmarks: () => store.bookmarks,

};