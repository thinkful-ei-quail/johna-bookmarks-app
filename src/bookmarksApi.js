const getUrl = (encodedUser, id) => {
  if(id)
    return `https://thinkful-list-api.herokuapp.com/${encodedUser}/bookmarks/${id}`;
  else
    return `https://thinkful-list-api.herokuapp.com/${encodedUser}/bookmarks`;
};

const apiCall = (url, method = "GET", body) => {
  let error;
  return fetch(url, { method, body: JSON.stringify(body), headers: body ? {'Content-Type': 'application/json'} : undefined})
    .then(res => {
      if(!res.ok) {
        console.log(`${res.status} ${res.statusText}`);
        error = true;
      }
      return res.json();
    })
    .then(json => { if(error) throw json.message; return json; });
};

export default {
  getAll: (encodedUser) => apiCall(getUrl(encodedUser)),
  insert: (encodedUser, propBag) => apiCall(getUrl(encodedUser), "POST", propBag),
  update: (encodedUser, id, propBag) => apiCall(getUrl(encodedUser, id), "PATCH", propBag),
  delete: (encodedUser, id) => apiCall(getUrl(encodedUser, id), "DELETE"),
};