if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./storage');
}

localStorage.setItem('myFirstKey', JSON.stringify({ msg: 'myFirstValue' }));

console.log(localStorage.getItem('myFirstKey'));