const fs=require('node:fs');
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','style.css','script.js','config.js','checkout.html','checkout.css','checkout.js']) fs.copyFileSync(name,'dist/'+name);
fs.cpSync('assets','dist/assets',{recursive:true});
