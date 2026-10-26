// Chrome (MV3, service worker)
const ID=chrome.runtime.id,HDR=['x-frame-options','content-security-policy','content-security-policy-report-only'];
chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[1,2],addRules:[
 // Google показываем во фрейме только для запросов из самого расширения
 {id:1,priority:1,action:{type:'modifyHeaders',responseHeaders:HDR.map(h=>({header:h,operation:'remove'}))},condition:{urlFilter:'||google.com/',resourceTypes:['sub_frame'],initiatorDomains:[ID]}},
 // https://127.0.0.1/?q=%s  ->  страница расширения (запрос сохраняется)
 {id:2,priority:1,action:{type:'redirect',redirect:{transform:{scheme:'chrome-extension',host:ID,port:'',path:'/app.html'}}},condition:{regexFilter:'^https?://127\\.0\\.0\\.1/',resourceTypes:['main_frame']}}]});
chrome.omnibox.setDefaultSuggestion({description:'Искать в Кубик расширения: %s'});
chrome.omnibox.onInputEntered.addListener(t=>chrome.tabs.update({url:chrome.runtime.getURL('app.html?q='+encodeURIComponent(t))}));
