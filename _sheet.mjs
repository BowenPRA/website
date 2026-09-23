import sharp from 'sharp';
const OUT='C:/Users/bowen/AppData/Local/Temp/claude/C--Users-bowen-Desktop-Admin-Email/b691b80c-7a48-49a0-9c8d-a1c2e6d80a5c/scratchpad/';
const [name, dir, listJson, cols] = process.argv.slice(2);
const files=JSON.parse(listJson);
const W=400,H=300,COLS=Number(cols||4);
const rows=Math.ceil(files.length/COLS);
const tiles=[];
for(let i=0;i<files.length;i++){
  const f=files[i];
  const img=await sharp(dir+'/'+f).rotate().resize(W,H,{fit:'contain',background:'#2b2b2b'}).png().toBuffer();
  const ov=Buffer.from(`<svg width="${W}" height="${H}"><text x="4" y="16" font-family="sans-serif" font-size="13" fill="#000" stroke="#fff" stroke-width="3.5" paint-order="stroke">${i+1}. ${f.replace(/\.jpg$/i,'')}</text></svg>`);
  tiles.push({input:await sharp(img).composite([{input:ov}]).png().toBuffer(),left:(i%COLS)*W,top:Math.floor(i/COLS)*H});
}
const bg=Buffer.from(`<svg width="${COLS*W}" height="${rows*H}"><rect width="100%" height="100%" fill="#2b2b2b"/></svg>`);
await sharp(bg).composite(tiles).jpeg({quality:84}).toFile(OUT+name+'.jpg');
console.log('ok',COLS*W,rows*H);
