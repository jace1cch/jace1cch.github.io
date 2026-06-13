#!/usr/bin/env node
/**
 * 后处理脚本: 为 Logseq SPA 生成图谱页面
 * 读取 tech/pages/ 和 tech/journals/ 中的 [[links]]，
 * 用 D3.js 生成力导向图谱，与 Logseq 桌面版风格一致。
 *
 * 在 publish-spa 构建后运行:
 *   node scripts/inject-graph.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'tech', 'pages');
const JOURNALS_DIR = path.join(ROOT, 'tech', 'journals');
const OUTPUT_DIR = path.join(ROOT, 'www');

// 解析 markdown 文件
function parseFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const name = path.basename(filepath, '.md');
  const links = [];

  // 提取 [[链接]]
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim();
    if (target !== name) links.push(target);
  }

  // 提取标题和标签
  const titleMatch = content.match(/title::\s*(.+)/);
  const tagsMatch = content.match(/tags::\s*(.+)/);
  const isJournal = filepath.includes('journals');

  return {
    id: name,
    label: titleMatch ? titleMatch[1].trim() : name,
    tags: tagsMatch ? tagsMatch[1].split(/,\s*/).map(t => t.trim()) : [],
    links,
    group: isJournal ? 'journal' : 'page',
  };
}

// 扫描目录
function scanDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.md')) {
      results.push(parseFile(path.join(dir, file)));
    }
  }
  return results;
}

const pages = scanDir(PAGES_DIR);
const journals = scanDir(JOURNALS_DIR);
const all = [...pages, ...journals];

// 构建节点
const nodeMap = {};
const nodes = all.map((p, i) => {
  nodeMap[p.id] = i;
  return { id: p.id, label: p.label, group: p.group, tags: p.tags };
});

// 构建边（去重）
const edgeSet = new Set();
const edges = [];
all.forEach(p => {
  p.links.forEach(target => {
    if (nodeMap[target] !== undefined) {
      const key = [p.id, target].sort().join('::');
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ source: p.id, target });
      }
    }
  });
});

// 计算节点大小（基于连接数）
const weight = {};
nodes.forEach(n => (weight[n.id] = 0));
edges.forEach(e => {
  weight[e.source] = (weight[e.source] || 0) + 1;
  weight[e.target] = (weight[e.target] || 0) + 1;
});
nodes.forEach(n => {
  n.size = Math.max(6, Math.min(24, (weight[n.id] || 0) * 5 + 6));
});

const graphData = { nodes, edges };
const dataJSON = JSON.stringify(graphData);

// 生成图谱 HTML
const html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>知识图谱 - Logseq</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#1a1a2e; overflow:hidden; font-family:system-ui,-apple-system,sans-serif; }
svg { width:100vw; height:100vh; }
.tooltip {
  position:absolute; background:rgba(0,0,0,0.9); color:#fff;
  padding:10px 16px; border-radius:10px; font-size:14px;
  pointer-events:none; display:none; z-index:100;
  box-shadow:0 4px 20px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1);
  backdrop-filter:blur(10px); max-width:300px;
}
.tooltip .label { font-size:15px; font-weight:600; margin-bottom:4px; }
.tooltip .meta { color:#888; font-size:12px; }
.node-text { font-size:11px; fill:#e0e0e0; pointer-events:none;
  text-shadow:0 1px 4px rgba(0,0,0,0.9); }
.link { stroke:rgba(255,255,255,0.12); stroke-width:1.5; }
.header {
  position:fixed; top:20px; left:50%; transform:translateX(-50%);
  color:rgba(255,255,255,0.4); font-size:13px; z-index:10;
  background:rgba(0,0,0,0.4); padding:6px 20px; border-radius:20px;
  backdrop-filter:blur(8px); pointer-events:none;
}
.legend {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  display:flex; gap:20px; font-size:12px; color:#888; z-index:10;
  background:rgba(0,0,0,0.5); padding:8px 20px; border-radius:12px;
  backdrop-filter:blur(8px);
}
.legend-item { display:flex; align-items:center; gap:6px; }
.dot { width:10px; height:10px; border-radius:50%; }
.no-graph {
  position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
  color:rgba(255,255,255,0.3); text-align:center; font-size:16px;
}
</style>
</head>
<body>
<div class="header">🕸 拖拽 · 滚轮缩放 · 点击进入页面</div>
<div id="tooltip" class="tooltip"></div>
<div class="legend">
  <div class="legend-item"><div class="dot" style="background:#6366f1"></div> 页面</div>
  <div class="legend-item"><div class="dot" style="background:#22c55e"></div> 日记</div>
</div>
<script>
const data = ${dataJSON};
const tooltip = document.getElementById('tooltip');

if (!data.nodes || data.nodes.length === 0) {
  document.body.innerHTML += '<div class="no-graph">📝 暂无数据<br><span style="font-size:13px">在笔记中添加 [[链接]] 后重新发布</span></div>';
} else {
  const w = window.innerWidth, h = window.innerHeight;
  const svg = d3.select('body').append('svg');
  const g = svg.append('g');

  const zoom = d3.zoom().scaleExtent([0.1,4]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);

  const color = d3.scaleOrdinal().domain(['page','journal']).range(['#6366f1','#22c55e']);

  const sim = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.edges).id(d=>d.id).distance(130))
    .force('charge', d3.forceManyBody().strength(-350))
    .force('center', d3.forceCenter(w/2, h/2))
    .force('collision', d3.forceCollide().radius(d=>d.size+8));

  const link = g.selectAll('.link').data(data.edges).join('line').attr('class','link');
  const node = g.selectAll('.node').data(data.nodes).join('g')
    .call(d3.drag()
      .on('start', (e,d)=>{ if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
      .on('drag', (e,d)=>{ d.fx=e.x; d.fy=e.y; })
      .on('end', (e,d)=>{ if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }))
    .on('click', (e,d) => { window.open('/#/page/'+d.id, '_self'); })
    .on('mouseenter', (e,d) => {
      tooltip.style.display='block';
      tooltip.innerHTML='<div class="label">'+d.label+'</div><div class="meta">'+d.id+(d.tags?.length ? '<br>🏷 '+d.tags.join(', ') : '')+'</div>';
    })
    .on('mousemove', e => { tooltip.style.left=(e.pageX+15)+'px'; tooltip.style.top=(e.pageY-10)+'px'; })
    .on('mouseleave', () => { tooltip.style.display='none'; });

  node.append('circle').attr('r', d=>d.size).attr('fill', d=>color(d.group))
    .attr('stroke','#fff').attr('stroke-width', d=>d.size>15?1.5:0.5).attr('opacity',0.9);
  node.append('text').text(d=>d.label).attr('dx', d=>d.size+6).attr('dy',4).attr('class','node-text');

  sim.on('tick', () => {
    link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node.attr('transform', d=>'translate('+d.x+','+d.y+')');
  });
}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'graph.html'), html);
const linkCount = edges.length;
console.log(`✅ 图谱已生成: www/graph.html (${nodes.length} 节点, ${edges.length} 连线)`);
if (nodes.length > 0 && edges.length === 0) {
  console.log('⚠️  有节点但无线，添加 [[链接]] 后可显示连线');
}
