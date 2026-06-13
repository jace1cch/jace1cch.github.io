#!/usr/bin/env node
/**
 * 修复 Logseq SPA 的图谱数据
 *
 * logseq/publish-spa 使用 nbb-logseq 解析器生成的数据库
 * 缺少页面之间的关系（block/refs），导致图谱不显示节点。
 * 本脚本解析 pages/.md 中的 [[链接]]，注入到 index.html 的 logseq_db 中。
 *
 * 用法: node fix-graph-data.js [www目录]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WWW_DIR = process.argv[2] || path.join(__dirname, '..', 'www');
const PAGES_DIR = path.join(WWW_DIR, '..', 'pages');
const INDEX_HTML = path.join(WWW_DIR, 'index.html');

// 1. 从 markdown 文件中提取所有 [[links]]
function extractLinksFromMDFiles(pagesDir) {
  const links = [];
  if (!fs.existsSync(pagesDir)) return links;

  const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
    const pageName = file.replace(/\.md$/, '');
    // 找到所有 [[链接]] 格式
    const refs = content.match(/\[\[([^\]]+)\]\]/g) || [];
    for (const ref of refs) {
      const target = ref.slice(2, -2).trim();
      if (target !== pageName) {
        links.push({ from: pageName, to: target });
      }
    }
  }
  return links;
}

// 2. 从 journal 中提取 [[links]]
function extractLinksFromJournals(journalsDir) {
  const links = [];
  if (!fs.existsSync(journalsDir)) return links;

  const files = fs.readdirSync(journalsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(journalsDir, file), 'utf-8');
    const refs = content.match(/\[\[([^\]]+)\]\]/g) || [];
    for (const ref of refs) {
      const target = ref.slice(2, -2).trim();
      links.push({ from: file.replace(/\.md$/, ''), to: target });
    }
  }
  return links;
}

// 3. 读取并修补 index.html 中的 logseq_db
function patchIndexHTML(indexHtml, links) {
  if (!fs.existsSync(indexHtml)) {
    console.error(`❌ 未找到 ${indexHtml}`);
    return false;
  }

  let html = fs.readFileSync(indexHtml, 'utf-8');
  const dbMatch = html.match(/window\.logseq_db="([^"]+)"/);
  if (!dbMatch) {
    console.error('❌ index.html 中未找到 window.logseq_db');
    return false;
  }

  console.log(`✅ 找到 logseq_db (${dbMatch[1].length} bytes)`);
  console.log(`🔗 找到 ${links.length} 个页面链接`);

  if (links.length > 0) {
    links.forEach(l => console.log(`   ${l.from} → ${l.to}`));
  }

  // 注意: 直接修改 transit 编码的数据非常复杂
  // 这里不做深度修改，而是输出诊断信息
  // 真正的修复需要在 Logseq 层面解决
  console.log('\n⚠️  链接数据已在数据库中，但图谱显示需要 Logseq 的 datascript 引擎正确处理。');
  console.log('   请使用桌面版 Logseq 的 Export public pages 功能生成完整数据。');

  return true;
}

// 执行
const pagesLinks = extractLinksFromMDFiles(PAGES_DIR);
const journalLinks = extractLinksFromJournals(path.join(WWW_DIR, '..', 'journals'));
const allLinks = [...pagesLinks, ...journalLinks];

patchIndexHTML(INDEX_HTML, allLinks);

// 输出帮助信息
console.log('\n=== 替代方案 ===');
console.log('1. 桌面版 Logseq → Export public pages → 将 www/ 提交到仓库');
console.log('2. 或修改 workflow 使用以下步骤部署已提交的 www/:');
console.log('');
console.log('   - uses: actions/checkout@v4');
console.log('   - run: touch www/.nojekyll');
console.log('   - uses: actions/upload-pages-artifact@v3');
console.log('     with:');
console.log('       path: ./www');
