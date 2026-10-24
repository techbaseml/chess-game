import fs from 'node:fs';
const databaseId=process.argv[2];
if(!databaseId||!/^[a-f0-9-]{36}$/i.test(databaseId))throw Error('Usage: node scripts/prepare-cloudflare-deploy.mjs YOUR_D1_DATABASE_ID');
const config={name:'nexa-chess',main:'dist/server/index.js',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],no_bundle:true,rules:[{type:'ESModule',globs:['**/*.js','**/*.mjs']}],assets:{directory:'dist/client'},d1_databases:[{binding:'DB',database_name:'nexa-chess',database_id:databaseId,migrations_dir:'drizzle'}]};
fs.writeFileSync('wrangler.deploy.json',JSON.stringify(config,null,2)+'\n');console.log('Created wrangler.deploy.json. This command did not deploy anything.');
