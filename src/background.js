import browser from 'webextension-polyfill';

let weatherInfo = {
    htmlCode: '',
    temp: 0,
    city: '',
    searchLink: 'https://www.baidu.com/s?wd=' + encodeURIComponent('天气'),
    icon: null,
    errorMessage: null,
    timer: null,
    interval: 20,
    isShowIcon: true,
    isShowTemp: true,
    arrowColor: ''
};

init();

function init() {
    browser.storage.local.get().then((result) => {
        if (result.city) weatherInfo.city = result.city;
        if (parseInt(result.interval)) weatherInfo.interval = parseInt(result.interval);
        if (typeof (result.isShowIcon) == 'boolean') weatherInfo.isShowIcon = result.isShowIcon;
        if (typeof (result.isShowTemp) == 'boolean') weatherInfo.isShowTemp = result.isShowTemp;
    }, onError).then(update).then(() => {
        weatherInfo.timer = setInterval(update, weatherInfo.interval * 60000);
    }).catch(onError);
    browser.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(request) {
    switch (request.action) {
        case 'update': {
            weatherInfo.htmlCode = '';
            return update().then(() => {
                if (weatherInfo.errorMessage) return { response: 'fail' };
                else return { response: 'success' };
            }).catch((e) => {
                onError(e);
                return { response: 'fail' };
            });
        }
        case 'get info': {
            return Promise.resolve({ response: weatherInfo.htmlCode });
        }
        case 'get error message': {
            return Promise.resolve({ response: weatherInfo.errorMessage });
        }
        case 'get settings': {
            return browser.storage.local.get().then(result => ({ response: result }));
        }
        case 'change settings': {
            return browser.storage.local.get().then(result => {
                let { city, interval, isShowIcon, isShowTemp } = request.settings;
                if (result.city !== city) {
                    weatherInfo.city = city;
                }
                if (result.interval !== interval) {
                    if (!parseInt(interval)) weatherInfo.interval = 20;
                    else weatherInfo.interval = parseInt(interval);
                    clearInterval(weatherInfo.timer);
                    weatherInfo.timer = setInterval(update, weatherInfo.interval * 60000);
                }
                if (result.isShowIcon !== isShowIcon) {
                    weatherInfo.isShowIcon = isShowIcon;
                    if (weatherInfo.isShowIcon) fetch(weatherInfo.icon, { credentials: 'include' }).then(setIcon).catch(onError);
                    else resetBadgeIcon();
                }
                if (result.isShowTemp !== isShowTemp) {
                    weatherInfo.isShowTemp = isShowTemp;
                    if (weatherInfo.isShowTemp) browser.browserAction.setBadgeText({ text: weatherInfo.temp });
                    else resetBadgeText();
                }
                return browser.storage.local.set({ city, interval, isShowIcon, isShowTemp }).then(() => {
                    if (result.city || city) return { response: 'update' };
                    else return { response: 'ok' };
                });
            });
        }
        case 'get arrowColor': {
            return Promise.resolve({ response: weatherInfo.arrowColor });
        }
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function onFetchError(error) {
    console.log(`Error: ${error}`);
    if (!weatherInfo.errorMessage) {
        weatherInfo.errorMessage = '网络请求连接失败';
    }
    resetBadge();
}

function getWeatherInfo() {
    return fetch(weatherInfo.searchLink + '+' + encodeURIComponent(weatherInfo.city), { credentials: 'include' }).catch(onFetchError);
}

function isOK(response) {
    if (response.ok) return response.text();
    else {
        weatherInfo.errorMessage = '更新失败';
        resetBadge();
    }
}

function parseInfo(text) {
    if (!text) {
        return;
    }
    let arrowColor = text.match(/class="op_weather4_twoicon_bg" style="background-image:-webkit-linear-gradient\(top,([^,]*),/),
        htmlCode = text.match(/(<div class="result-op c-container[\s\S]*?<\/div>)\s+<div class="result c-container/)[1]
            .replace(/<h3[\s\S]*?<\/h3>/, '')
            .replace(/<div class="op_weather4_xiala"[\s\S]*<\/div>/, '</div>')
            .replace(/<script[\s\S]*?<\/script>/g, '');
    if (htmlCode) {
        weatherInfo.htmlCode = htmlCode;
        weatherInfo.arrowColor = arrowColor ? arrowColor[1] : '';
        weatherInfo.temp = htmlCode.match(/<span class="op_weather4_twoicon_shishi_title">(\d+)<\/span>/)[1];
        weatherInfo.icon = htmlCode.match(/<div class="op_weather4_twoicon_icon" style="background-image:url\(([^(]*?)\)/)[1];
        if (weatherInfo.icon) fetch(weatherInfo.icon, { credentials: 'include' }).then(setIcon).catch(onError);
        if (weatherInfo.isShowTemp) browser.browserAction.setBadgeText({ text: weatherInfo.temp });
        else resetBadgeText();
        weatherInfo.errorMessage = null;
    } else {
        weatherInfo.errorMessage = '抓取规则匹配失败';
        resetBadge();
    }
}

function update() {
    return getWeatherInfo().then(isOK).then(parseInfo);
}

function resetBadge() {
    resetBadgeText();
    resetBadgeIcon();
}

function resetBadgeIcon() {
    browser.browserAction.setIcon({ path: 'favicon.png' });
}

function resetBadgeText() {
    browser.browserAction.setBadgeText({ text: '' });
}

function setIcon(response) {
    if (response.ok)
        response.blob().then((myBlob) => {
            let objectURL = URL.createObjectURL(myBlob),
                img = new Image();
            img.onload = e => {
                if (e.type == 'load') browser.browserAction.setIcon({ imageData: drawCanvas(e) });
                else resetBadgeText();
            };
            img.onerror = resetBadgeText;
            img.src = objectURL;
        });
}

function drawCanvas(e) {
    let ctx = document.createElement('canvas').getContext('2d');
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.drawImage(e.target, 4, 0, 70, 70);
    return ctx.getImageData(0, 0, 78, 78);
}