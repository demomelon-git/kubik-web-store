// Firefox / Fennec (MV2)
const page=browser.runtime.getURL('app.html');
browser.webRequest.onBeforeRequest.addListener(d=>({redirectUrl:page+new URL(d.url).search}),{urls:['https://127.0.0.1/*','http://127.0.0.1/*'],types:['main_frame']},['blocking']);
browser.webRequest.onHeadersReceived.addListener(d=>({responseHeaders:d.responseHeaders.filter(h=>{const n=h.name.toLowerCase();return n!=='x-frame-options'&&n!=='content-security-policy'&&n!=='content-security-policy-report-only'})}),
 {urls:['https://www.google.com/*','https://consent.google.com/*'],types:['sub_frame']},['blocking','responseHeaders']);
