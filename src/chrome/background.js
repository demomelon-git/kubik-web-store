// Chrome (Manifest V3): service worker
// Снимаем заголовки, запрещающие фреймы, только для запросов, которые идут из самого расширения
const ID=chrome.runtime.id,HDR=['x-frame-options','content-security-policy','content-security-policy-report-only'];
const toExt=(path,extra)=>({type:'redirect',redirect:{transform:Object.assign({scheme:'chrome-extension',host:ID,port:'',path},extra||{})}});
chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[1,2,3],addRules:[
 // Снимаем заголовки, запрещающие фреймы, только для запросов из самого расширения
 {id:1,priority:1,action:{type:'modifyHeaders',responseHeaders:HDR.map(h=>({header:h,operation:'remove'}))},condition:{urlFilter:'||google.com/',resourceTypes:['sub_frame'],initiatorDomains:[ID]}},
 // https://127.0.0.1/?q=%s  — адрес поисковой системы (открывает выдачу Кубика)
 {id:2,priority:2,action:toExt('/results.html'),condition:{regexFilter:'^https?://127\\.0\\.0\\.1/\\?(.*&)?q=',resourceTypes:['main_frame']}},
 // https://127.0.0.1/  — адрес домашней страницы (открывает главную Кубика)
 {id:3,priority:1,action:toExt('/newtab.html',{query:''}),condition:{regexFilter:'^https?://127\\.0\\.0\\.1/',resourceTypes:['main_frame']}}]});
// Поиск из адресной строки: введи «kub», пробел и запрос
chrome.omnibox.setDefaultSuggestion({description:'Искать в Кубике: %s'});
chrome.omnibox.onInputEntered.addListener(t=>chrome.tabs.update({url:chrome.runtime.getURL('results.html?q='+encodeURIComponent(t))}));
