const fs=require('fs'),path=require('path');const sharp=require('sharp');
const sources=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
(async()=>{for(const [id,source]of Object.entries(sources)){await sharp(source).resize({width:id==='arena'?1920:id==='stick'?512:640,withoutEnlargement:true}).webp({quality:90,alphaQuality:100}).toFile(path.join(__dirname,'../assets',id+'.webp'));console.log(id);}})();
