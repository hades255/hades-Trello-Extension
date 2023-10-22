const debounce = (func, timeout = 500) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

async function getTab() {
  let queryOptions = { active: true, currentWindow: true };
  let tabs = await chrome.tabs.query(queryOptions);
  return tabs[0].id;
}

const changeWidth = async (val) => {
  const tabId = await getTab();
  await chrome.tabs.sendMessage(tabId, {
    from: 'changeWidth',
    value: val,
  });
};

const changeFont = async (val) => {
  const tabId = await getTab();
  await chrome.tabs.sendMessage(tabId, {
    from: 'changeFont',
    value: val,
  });
};

document.addEventListener('DOMContentLoaded', function () {
  var listWidth = document.getElementById("list-width");
  listWidth.oninput = debounce(function () {
    var value = listWidth.value;
    changeWidth(value)
  });

  var listFont = document.getElementById("list-font");
  listFont.oninput = debounce(function () {
    var value = listFont.value;
    changeFont(value)
  });

  chrome.storage.sync.get(['tmListWidth', 'tmFontSize'], function (result) {
    if (result.tmListWidth) {
      document.getElementById('list-width').value = result.tmListWidth
    }
    if (result.tmFontSize) {
      document.getElementById('list-font').value = result.tmFontSize
    }
  });
}, false);