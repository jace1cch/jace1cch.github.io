#!/usr/bin/env node
/**
 * 为 Logseq SPA 生成独立的图谱页面
 * 用法: node build-graph.js <pages目录> <journals目录> <输出路径>
 *
 * 读取 markdown 文件中的 [[链接]]，生成 D3.js 力导向图谱，
 * 输出到 www/graph.html，可通过 /graph.html 访问。
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = process.argv[2] || path.join(__dirname, '..', 'tech', 'pages');
const JOURNALS_DIR = process.argv[3] || path.join(__dirname, '..', 'tech', 'journals');
const OUTPUT = process.argv[4] || path.join(__dirname, '..', 'www', 'graph.html');

// 提取 [[链接]] 和页面标题
function parseMD(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const name = path.basename(filepath, '.md');
  const links = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim().replace(/\s+/g, '-').toLowerCase();
    if (target !== name) links.push(target);
  }
  // 提取 public:: true
  const isPublic = /public::\s*true/.test(content);
  // 提取 title:: 或使用文件名
  const titleMatch = content.match(/title::\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : name;
  return { name, title, links, isPublic, isJournal: filepath.includes('journals') };
}

// 扫描目录
function scanDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.md')) {
      results.push(parseMD(path.join(dir, file)));
    }
  }
  return results;
}

const pages = scanDir(PAGES_DIR);
const journals = scanDir(JOURNALS_DIR);
const all = [...pages, ...journals];

// 构建节点和链接
const nameSet = new Set(all.map(p => p.name));
const nodes = [];
const nodeMap = {};
all.forEach((p, i) => {
  nodeMap[p.name] = i;
  nodes.push({
    id: p.name,
    label: p.title,
    group: p.isJournal ? 'journal' : 'page',
    isPublic: p.isPublic,
  });
});

const linkSet = new Set();
const links = [];
all.forEach(p => {
  p.links.forEach(target => {
    // 只保留指向已知页面的链接
    if (nodeMap[target] !== undefined) {
      const key = `${p.name}->${target}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source: p.name, target });
      }
    }
  });
});

// 按连接数计算节点大小
const linkCount = {};
links.forEach(l => {
  linkCount[l.source] = (linkCount[l.source] || 0) + 1;
  linkCount[l.target] = (linkCount[l.target] || 0) + 1;
});
nodes.forEach(n => {
  n.size = Math.max(5, Math.min(20, (linkCount[n.id] || 0) * 4 + 5));
});

const data = JSON.stringify({ nodes, links });

// 生成 HTML
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>知识图谱 - Logseq Notes</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a1a2e; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
svg { width: 100vw; height: 100vh; }
.tooltip {
  position: absolute;
  background: rgba(0,0,0,0.85);
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  pointer-events: none;
  display: none;
  max-width: 300px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}
.legend {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 12px;
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #aaa;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; }
.info {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #888;
  font-size: 13px;
  background: rgba(0,0,0,0.5);
  padding: 6px 16px;
  border-radius: 20px;
  pointer-events: none;
}
.node-label { font-size: 12px; pointer-events: none; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
</style>
</head>
<body>
<div class="info">🖱 拖拽节点 · 滚轮缩放 · 点击跳转</div>
<div class="tooltip" id="tooltip"></div>
<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#6366f1"></div> 页面</div>
  <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div> 日记</div>
  <div class="legend-item" style="color:#555">|</div>
  <div style="color:#555">节点大小 = 链接数量</div>
</div>
<script>
const data = ${data};
const tooltip = document.getElementById('tooltip');
const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select('body').append('svg')
  .attr('width', width).attr('height', height);

const g = svg.append('g');
const zoom = d3.zoom()
  .scaleExtent([0.1, 4])
  .on('zoom', (event) => g.attr('transform', event.transform));
svg.call(zoom);

const color = d3.scaleOrdinal()
  .domain(['page', 'journal'])
  .range(['#6366f1', '#22c55e']);

const simulation = d3.forceSimulation(data.nodes)
  .force('link', d3.forceLink(data.links).id(d => d.id).distance(120))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(d => d.size + 10));

const link = g.append('g')
  .selectAll('line')
  .data(data.links)
  .join('line')
  .attr('stroke', '#ffffff20')
  .attr('stroke-width', 1.5);

const node = g.append('g')
  .selectAll('g')
  .data(data.nodes)
  .join('g')
  .call(d3.drag()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    })
  )
  .on('click', (event, d) => {
    window.open('https://jace1cch.github.io/#/page/' + d.id, '_blank');
  })
  .on('mouseenter', (event, d) => {
    tooltip.style.display = 'block';
    tooltip.innerHTML = '<strong>' + d.label + '</strong><br><span style="color:#888;font-size:12px">' + d.id + '</span>';
  })
  .on('mousemove', (event) => {
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
  })
  .on('mouseleave', () => { tooltip.style.display = 'none'; });

node.append('circle')
  .attr('r', d => d.size)
  .attr('fill', d => color(d.group))
  .attr('stroke', '#fff')
  .attr('stroke-width', 1)
  .attr('opacity', 0.9);

node.append('text')
  .text(d => d.label)
  .attr('dx', d => d.size + 6)
  .attr('dy', 4)
  .attr('class', 'node-label')
  .attr('fill', '#e0e0e0');

simulation.on('tick', () => {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);
  node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
});

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  svg.attr('width', width).attr('height', height);
  simulation.force('center', d3.forceCenter(width / 2, height / 2));
  simulation.alpha(0.3).restart();
});
</script>
</body>
</html>`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, html, 'utf-8');
console.log(`✅ 图谱已生成: ${OUTPUT}`);
console.log(`   ${nodes.length} 个节点, ${links.length} 条连线`);
if (nodes.length === 0) {
  console.log('   ⚠️ 没有找到节点，请检查 pages/ 目录路径');
}
