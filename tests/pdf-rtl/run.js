const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const [,, rtlPath, name, casesFile]=process.argv;
 const html=fs.readFileSync(__dirname+'/page.html','utf8').replace('PDFRTL','file://'+rtlPath);
 fs.writeFileSync(__dirname+'/_p.html',html);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:760,height:1400}});
 await p.goto('file://'+__dirname+'/_p.html');
 const items=JSON.parse(fs.readFileSync(casesFile,'utf8'));
 await p.evaluate(i=>window.run(i),items);
 const leak=await p.evaluate(()=>[...document.querySelector('#dom').querySelectorAll('*')].filter(e=>/bidi(rtl|ltr)x/.test(e.getAttribute('style')||'')).length);console.log('leaked tags in live DOM:',leak,'| fillText directions logged via harness');
 await p.locator('#dom').first().screenshot({path:`${name}_dom.png`});
 await p.locator('#cv').screenshot({path:`${name}_cv.png`});
 await b.close();
})();
