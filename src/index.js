import $ from 'jquery';
import bookmarks from './bookmarks.js';
import store from './bookmarksStore.js';
import 'normalize.css';
import './core.css';

/*
  Change displayed Url without actually performing a navigation
  We take a relative Url because it's convenient and the browser won't let us stray too far anyway
 */
const changeLocationRelative = (relativeUrl) => {
  history.replaceState(history.state, '', new URL(relativeUrl, location.href));
};

/*
  1. Figure out whose bookmarks we're displaying
  2. Set the canonical query string in the browser, if not already set
  3. Return encoded (for use in api) and decoded (for display) user name
 */
const resolveUser = () => {
  let encodedUser, decodedUser;
  let specifiedUser = location.search.substring(1); // strip the leading ?
  if(!specifiedUser) {
    encodedUser = decodedUser = "TestBot";
    changeLocationRelative("?TestBot");
  } else {
    try {
      decodedUser = decodeURIComponent(specifiedUser);
      encodedUser = encodeURIComponent(decodedUser);
      if(encodedUser !== specifiedUser)
        changeLocationRelative(`?${encodedUser}`);
    } catch(err) {
      encodedUser = decodedUser = "TestBot";
      changeLocationRelative("?TestBot");
    }
  }
  return { encodedUser, decodedUser };
};

const getLinkedId = hash => hash.split('-').pop();

/*
  Get this show on the road!
 */
$(() => {
  const user = resolveUser();
  store.assignUser(user.encodedUser, user.decodedUser);
  $('header>h1').text(document.title = `${user.decodedUser}'s Bookmarks`);
  bookmarks.init(getLinkedId(location.hash));
  $(window).on('hashchange', () => bookmarks.expand(getLinkedId(location.hash)));
});
