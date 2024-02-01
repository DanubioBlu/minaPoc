// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as pathnode from 'path';
import fs from "fs";

type Data = {
  name: string
}

export default async  function handler(
  req: NextApiRequest,
  res: NextApiResponse<{"manifest":any}>
) {

    var result:{name:string; type:string}[]=[];
    var rootPath=process.cwd();

    var type = req.query['type'];

    if(type== undefined){
      throw(`type not defined`);
    }

    var rooSubPath = 'public/assets/cache';
    var pathCache='';

    switch(type){
      case 'main':
        pathCache = rooSubPath;
      break;
      case 'oracle':
        pathCache = pathnode.join(rooSubPath, 'onlyoracle');
      break;
      case 'offchain':
        pathCache = pathnode.join(rooSubPath, 'onlytree');
      break;
    }

    var cacheFolder=pathnode.join(rootPath, pathCache);
    const filenames = fs.readdirSync(cacheFolder);

    const filePercorsi = filenames.forEach(file => {       
        var fileFolder = pathnode.join(cacheFolder, file);
        if(fs.statSync(fileFolder).isFile() 

        && pathnode.extname(fileFolder).toLowerCase() != '.header'){
            result.push({name:file,type:'string'});
        }
    });
   
  res.status(200).json({"manifest":result});
}
