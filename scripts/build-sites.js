#!/usr/bin/env node

// build static sites using handlebar templates


import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import Handlebars from 'handlebars';

const BASEDIR = resolve('../src/sites');

async function fetchTpl(subdir) {
  let tplFile = await open(`${BASEDIR}/${subdir}`);
  let tpl = await tplFile.readFile({ encoding: 'utf8'})
  await tplFile.close();

  return tpl;
}


(async () => {
  Handlebars.registerPartial('nav', await fetchTpl('partials/nav.hbs'))

  let tpl = await fetchTpl('layouts/base.hbs');
  tpl = Handlebars.compile(tpl);

  console.log(tpl({ title: "this ma title" }));
})();
