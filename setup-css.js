var 
    cssFile = chrome.extension.getURL('css/layout.css')
  , board = document.getElementById('board')
  , classVertical = 'layout-trello-vertical'
  , classMixed = 'layout-trello-mixed';

function insertCss() {
  if (document.getElementById('layoutcss') === null) {
    var css = document.createElement('link');
    css.id = 'layoutcss';
    css.type = 'text/css';
    css.rel = 'stylesheet';
    css.href = cssFile;
    document.getElementsByTagName('head')[0].appendChild(css);
  }
}

insertCss();

chrome.storage.sync.get(['classList', 'listWidth', 'listHeight'], function (result) {
  if (result.classList) {
    board.classList.add(result.classList);
  }
  if (result.listWidth) {
    document.querySelectorAll('#board .js-list.list-wrapper').forEach(el => el.style.width = result.listWidth + "px");
    document.querySelectorAll('#board .list-card').forEach(el => el.style.maxWidth = "100%");
  }
  if (result.listHeight) {
    document.querySelectorAll('#board div.list.js-list-content').forEach(el => el.style.maxHeight = result.listHeight + "vh");
  }
});