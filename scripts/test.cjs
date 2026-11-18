const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const files=fs.readdirSync('scripts').filter(file=>/^test-.*\.cjs$/.test(file)&&file!=='test-pwa.cjs').sort();
let failed=false;
for(const file of files){console.log(`\n${file}`);const result=spawnSync(process.execPath,[`scripts/${file}`],{stdio:'inherit',env:process.env});if(result.status!==0)failed=true;}
process.exitCode=failed?1:0;
