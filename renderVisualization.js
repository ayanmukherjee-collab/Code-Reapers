/**
 * Floor Plan Visualization Renderer
 * 
 * Generates an interactive HTML visualization of floor scan data
 * with bounding boxes, node graph, and edges rendered on canvas.
 * Now with zoom/pan controls and "fit to view" functionality.
 * 
 * @module renderVisualization
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  colors: {
    room: { fill: 'rgba(66, 135, 245, 0.2)', stroke: '#4287f5', label: '#2563eb' },
    hall: { fill: 'rgba(245, 158, 66, 0.2)', stroke: '#f59e42', label: '#d97706' },
    stairs: { fill: 'rgba(66, 245, 117, 0.3)', stroke: '#42f575', label: '#16a34a' },
    elevator: { fill: 'rgba(245, 66, 239, 0.3)', stroke: '#f542ef', label: '#c026d3' },
    door: { fill: 'rgba(245, 66, 66, 0.3)', stroke: '#f54242', label: '#dc2626' }
  },
  node: { radius: 5, strokeWidth: 2 },
  edge: { color: '#666', width: 1.5, verticalColor: '#22c55e', verticalWidth: 3 },
  label: { fontSize: 9, fontFamily: 'Arial, sans-serif' }
};

// =============================================================================
// HTML TEMPLATE GENERATOR
// =============================================================================

function generateHTML(floorScan, imagePath) {
  const graph = floorScan.graph || { nodes: [], edges: [] };
  const entities = floorScan.entities || extractEntitiesFromNodes(graph.nodes);

  let imageBase64 = '';
  let imageWidth = 1000;
  let imageHeight = 800;

  if (imagePath && fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    imageBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    const dimensions = getImageDimensions(imageBuffer);
    if (dimensions) {
      imageWidth = dimensions.width;
      imageHeight = dimensions.height;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Floor Plan Visualization - ${floorScan.source || 'Unknown'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #1a1a2e;
      min-height: 100vh;
      color: #fff;
    }
    .header {
      text-align: center;
      padding: 10px;
      background: #0f0f23;
      border-bottom: 1px solid #333;
    }
    .header h1 {
      font-size: 18px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .toolbar {
      display: flex;
      gap: 10px;
      padding: 10px;
      background: #0f0f23;
      border-bottom: 1px solid #333;
      flex-wrap: wrap;
      align-items: center;
    }
    .toolbar button {
      padding: 6px 12px;
      background: #333;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar button:hover { background: #444; }
    .toolbar button.active { background: #667eea; border-color: #667eea; }
    .toolbar label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #aaa;
    }
    .toolbar input[type="checkbox"] { accent-color: #667eea; }
    .toolbar .zoom-info { margin-left: auto; color: #888; font-size: 12px; }
    .main-container {
      display: flex;
      height: calc(100vh - 90px);
    }
    .canvas-container {
      flex: 1;
      overflow: hidden;
      position: relative;
      background: #222;
    }
    #canvas {
      display: block;
      transform-origin: 0 0;
    }
    .sidebar {
      width: 280px;
      background: #0f0f23;
      padding: 12px;
      overflow-y: auto;
      border-left: 1px solid #333;
    }
    .sidebar h3 {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .stat-item span:first-child { color: #888; }
    .hover-info {
      margin-top: 12px;
      padding: 10px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(102, 126, 234, 0.2);
      min-height: 60px;
      font-size: 12px;
    }
    .hover-info h4 { color: #667eea; margin-bottom: 6px; font-size: 11px; }
    .color-legend {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-top: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #aaa;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏢 Floor Plan Visualization - ${floorScan.source || 'Unknown'}</h1>
  </div>
  
  <div class="toolbar">
    <button id="fitBtn">📐 Fit to View</button>
    <button id="zoomInBtn">🔍+</button>
    <button id="zoomOutBtn">🔍-</button>
    <button id="resetBtn">↺ Reset</button>
    <span style="color:#555">|</span>
    <label><input type="checkbox" id="showImage" checked> Image</label>
    <label><input type="checkbox" id="showRooms" checked> Rooms</label>
    <label><input type="checkbox" id="showHalls" checked> Halls</label>
    <label><input type="checkbox" id="showStairs" checked> Stairs</label>
    <label><input type="checkbox" id="showElevators" checked> Elevators</label>
    <label><input type="checkbox" id="showDoors" checked> Doors</label>
    <label><input type="checkbox" id="showNodes" checked> Nodes</label>
    <label><input type="checkbox" id="showEdges" checked> Edges</label>
    <label><input type="checkbox" id="showLabels"> Labels</label>
    <span class="zoom-info">Zoom: <span id="zoomLevel">100%</span></span>
  </div>
  
  <div class="main-container">
    <div class="canvas-container" id="canvasContainer">
      <canvas id="canvas"></canvas>
    </div>
    
    <div class="sidebar">
      <h3>Statistics</h3>
      <div class="stat-item"><span>Image Size</span><span>${imageWidth} x ${imageHeight}</span></div>
      <div class="stat-item"><span>Nodes</span><span>${graph.nodes?.length || 0}</span></div>
      <div class="stat-item"><span>Edges</span><span>${graph.edges?.length || 0}</span></div>
      <div class="stat-item"><span>Rooms</span><span>${entities.rooms?.length || 0}</span></div>
      <div class="stat-item"><span>Halls</span><span>${entities.halls?.length || 0}</span></div>
      <div class="stat-item"><span>Stairs</span><span>${entities.stairs?.length || 0}</span></div>
      <div class="stat-item"><span>Elevators</span><span>${entities.elevators?.length || 0}</span></div>
      <div class="stat-item"><span>Doors</span><span>${entities.doors?.length || 0}</span></div>
      
      <h3 style="margin-top:15px">Legend</h3>
      <div class="color-legend">
        <div class="legend-item"><div class="legend-dot" style="background:${CONFIG.colors.room.stroke}"></div>Room</div>
        <div class="legend-item"><div class="legend-dot" style="background:${CONFIG.colors.hall.stroke}"></div>Hall</div>
        <div class="legend-item"><div class="legend-dot" style="background:${CONFIG.colors.stairs.stroke}"></div>Stairs</div>
        <div class="legend-item"><div class="legend-dot" style="background:${CONFIG.colors.elevator.stroke}"></div>Elevator</div>
        <div class="legend-item"><div class="legend-dot" style="background:${CONFIG.colors.door.stroke}"></div>Door</div>
      </div>
      
      <div class="hover-info">
        <h4>Hover Info</h4>
        <p id="hoverInfo">Move cursor over nodes to see details.</p>
      </div>
      
      <h3 style="margin-top:15px">Debug Info</h3>
      <div class="stat-item"><span>AI Coord Max X</span><span id="debugMaxX">-</span></div>
      <div class="stat-item"><span>AI Coord Max Y</span><span id="debugMaxY">-</span></div>
      <div class="stat-item"><span>Scale X</span><span id="debugScaleX">-</span></div>
      <div class="stat-item"><span>Scale Y</span><span id="debugScaleY">-</span></div>
    </div>
  </div>

  <script>
    const floorScan = ${JSON.stringify(floorScan, null, 2)};
    const imageBase64 = "${imageBase64}";
    const CONFIG = ${JSON.stringify(CONFIG, null, 2)};
    const IMAGE_WIDTH = ${imageWidth};
    const IMAGE_HEIGHT = ${imageHeight};
    
    const container = document.getElementById('canvasContainer');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const hoverInfo = document.getElementById('hoverInfo');
    
    // Set canvas to actual image size
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    
    // View state
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    // Data
    const graph = floorScan.graph || { nodes: [], edges: [] };
    const entities = floorScan.entities || extractEntitiesFromNodes(graph.nodes);
    const nodeMap = new Map();
    graph.nodes.forEach(n => nodeMap.set(n.id, n));
    
    // Calculate AI coordinate bounds and compute a transform that maps
    // AI coordinates (which may be in an arbitrary space) into image pixels.
    let aiMinX = Infinity, aiMinY = Infinity, aiMaxX = -Infinity, aiMaxY = -Infinity;
    graph.nodes.forEach(node => {
      const bbox = node.metadata?.bbox;
      if (bbox) {
        aiMinX = Math.min(aiMinX, bbox.x);
        aiMinY = Math.min(aiMinY, bbox.y);
        aiMaxX = Math.max(aiMaxX, bbox.x + bbox.width);
        aiMaxY = Math.max(aiMaxY, bbox.y + bbox.height);
      }
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        aiMinX = Math.min(aiMinX, node.x);
        aiMinY = Math.min(aiMinY, node.y);
        aiMaxX = Math.max(aiMaxX, node.x);
        aiMaxY = Math.max(aiMaxY, node.y);
      }
    });

    if (!isFinite(aiMinX)) { aiMinX = 0; aiMinY = 0; aiMaxX = 1; aiMaxY = 1; }

    let scaleX = 1;
    let scaleY = 1;
    // Compute graph size
    const graphWidth = Math.max(1, aiMaxX - aiMinX);
    const graphHeight = Math.max(1, aiMaxY - aiMinY);
    // Padding so nodes aren't flush to the canvas edge
    const pad = Math.min(IMAGE_WIDTH, IMAGE_HEIGHT) * 0.05;
    const s = Math.min((IMAGE_WIDTH - 2 * pad) / graphWidth, (IMAGE_HEIGHT - 2 * pad) / graphHeight);
    scaleX = s; scaleY = s;

    // Center the graph in image pixel space
    const imageCenterX = IMAGE_WIDTH / 2;
    const imageCenterY = IMAGE_HEIGHT / 2;
    const graphCenterX = aiMinX + graphWidth / 2;
    const graphCenterY = aiMinY + graphHeight / 2;
    const offsetX = imageCenterX - graphCenterX * scaleX;
    const offsetY = imageCenterY - graphCenterY * scaleY;

    // Affine/refined transform vars
    let useAffine = false;
    let A = [1,0,0, 0,1,0]; // a11,a12,a13, a21,a22,a23

    // Helper transforms from AI coords -> image pixels
    function tx(x, y) { 
      if (useAffine) return A[0]*x + A[1]*y + A[2];
      return x * scaleX + offsetX; 
    }
    function ty(x, y) { 
      if (useAffine) return A[3]*x + A[4]*y + A[5];
      return y * scaleY + offsetY; 
    }

    function buildLandmarkPairs() {
      const src = []; const dst = [];
      const labels = floorScan.labels || [];
      const entityRooms = floorScan.entities?.rooms || entities.rooms || [];
      const labelByAnchor = new Map();
      labels.forEach(l => { if (l.anchorId) labelByAnchor.set(l.anchorId, l); });
      entityRooms.forEach(r => {
        const bbox = r.bbox || r.bounds || null;
        if (!bbox) return;
        const centerSrc = [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
        const l = labelByAnchor.get(r.id) || labels.find(ll => ll.text && r.label && ll.text === r.label);
        if (l && l.position) {
          const centerDst = [l.position.x, l.position.y];
          src.push(centerSrc); dst.push(centerDst);
        }
      });
      return { src, dst };
    }

    function estimateAffine(srcPts, dstPts) {
      // Solve linear least squares for 6 params: a11 a12 a13 a21 a22 a23
      const n = srcPts.length;
      if (n < 3) return null;
      // Build matrices
      // M * p = b
      const M = []; const b = [];
      for (let i=0;i<n;i++){
        const [x,y] = srcPts[i];
        const [u,v] = dstPts[i];
        M.push([x,y,1,0,0,0]); b.push(u);
        M.push([0,0,0,x,y,1]); b.push(v);
      }
      // Compute p = (M^T M)^-1 M^T b using simple linear solver
      function transpose(mat) { return mat[0].map((_,i)=>mat.map(r=>r[i])); }
      function matMul(A,B) { const m=A.length,n=B[0].length,p=B.length; const R=Array.from({length:m},()=>Array(n).fill(0)); for(let i=0;i<m;i++) for(let k=0;k<p;k++) for(let j=0;j<n;j++) R[i][j]+=A[i][k]*B[k][j]; return R; }
      function matVecMul(A,v){ const m=A.length,n=A[0].length; const r=Array(m).fill(0); for(let i=0;i<m;i++) for(let j=0;j<n;j++) r[i]+=A[i][j]*v[j]; return r; }
      function solveLinear(A,b){ // Gaussian elimination
        const n=A.length; const M=A.map((r,i)=>r.concat([b[i]]));
        for(let i=0;i<n;i++){
          // pivot
          let maxRow=i; for(let k=i+1;k<n;k++) if (Math.abs(M[k][i])>Math.abs(M[maxRow][i])) maxRow=k;
          const tmp=M[i]; M[i]=M[maxRow]; M[maxRow]=tmp;
          if (Math.abs(M[i][i])<1e-12) return null;
          // normalize
          const div=M[i][i]; for(let j=i;j<=n;j++) M[i][j]/=div;
          for(let k=0;k<n;k++) if(k!==i){ const factor=M[k][i]; for(let j=i;j<=n;j++) M[k][j]-=factor*M[i][j]; }
        }
        return M.map(r=>r[n]);
      }

      const Mt = transpose(M);
      const MtM = matMul(Mt, M);
      const MtB = matVecMul(Mt, b);
      try {
        const p = solveLinear(MtM, MtB);
        return p; // length 6
      } catch (e) { return null; }
    }

    function ransacAffine(src, dst, iter=200, threshold=12) {
      if (src.length < 3) return null;
      let best = {inliers:[], params:null};
      for (let k=0;k<iter;k++){
        // sample 3 random indices
        const idx = new Set(); while (idx.size<3) idx.add(Math.floor(Math.random()*src.length));
        const sampleIdx = Array.from(idx);
        const sSrc = sampleIdx.map(i=>src[i]);
        const sDst = sampleIdx.map(i=>dst[i]);
        const p = estimateAffine(sSrc, sDst);
        if (!p) continue;
        const inliers = [];
        for (let i=0;i<src.length;i++){
          const [x,y] = src[i];
          const uPred = p[0]*x + p[1]*y + p[2];
          const vPred = p[3]*x + p[4]*y + p[5];
          const [u,v] = dst[i];
          const err = Math.hypot(u-uPred, v-vPred);
          if (err <= threshold) inliers.push(i);
        }
        if (inliers.length > best.inliers.length) {
          best.inliers = inliers; best.params = p;
        }
      }
      if (best.inliers.length >= 3) {
        const inSrc = best.inliers.map(i=>src[i]);
        const inDst = best.inliers.map(i=>dst[i]);
        const refined = estimateAffine(inSrc, inDst);
        return {params: refined || best.params, inliers: best.inliers};
      }
      return null;
    }

    // Try to compute landmark-based affine refinement
    try {
      const pairs = buildLandmarkPairs();
      if (pairs.src.length >= 3 && typeof numeric !== 'undefined') {
        const r = ransacAffine(pairs.src, pairs.dst, 300, Math.max(8, Math.min(20, Math.min(IMAGE_WIDTH, IMAGE_HEIGHT)*0.01)));
        if (r && r.params) {
          A = r.params.slice(0,6);
          useAffine = true;
          console.log('Affine refinement applied using', r.inliers.length, 'landmarks');
        }
      }
    } catch (e) { /* ignore */ }

    // Update debug info
    document.getElementById('debugMaxX').textContent = Math.round(aiMaxX);
    document.getElementById('debugMaxY').textContent = Math.round(aiMaxY);
    document.getElementById('debugScaleX').textContent = scaleX.toFixed(2);
    document.getElementById('debugScaleY').textContent = scaleY.toFixed(2);
    
    function extractEntitiesFromNodes(nodes) {
      return {
        rooms: nodes.filter(n => n.type === 'room').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
        halls: nodes.filter(n => n.type === 'hall').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
        stairs: nodes.filter(n => n.type === 'stairs').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
        elevators: nodes.filter(n => n.type === 'elevator').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
        doors: nodes.filter(n => n.type === 'door').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox }))
      };
    }
    
    // Background image
    const bgImage = new Image();
    let imageLoaded = false;
    if (imageBase64) {
      bgImage.onload = () => { imageLoaded = true; render(); fitToView(); };
      bgImage.src = imageBase64;
    } else {
      fitToView();
      render();
    }
    
    function updateTransform() {
      canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
      document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
    }
    
    function fitToView() {
      const containerRect = container.getBoundingClientRect();
      const scaleX = (containerRect.width - 20) / canvas.width;
      const scaleY = (containerRect.height - 20) / canvas.height;
      zoom = Math.min(scaleX, scaleY, 1);
      panX = (containerRect.width - canvas.width * zoom) / 2;
      panY = (containerRect.height - canvas.height * zoom) / 2;
      updateTransform();
    }
    
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      if (document.getElementById('showImage').checked && imageLoaded) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      const showLabels = document.getElementById('showLabels').checked;
      
      if (document.getElementById('showRooms').checked) drawBBoxes(entities.rooms, 'room', showLabels);
      if (document.getElementById('showHalls').checked) drawBBoxes(entities.halls, 'hall', showLabels);
      if (document.getElementById('showStairs').checked) drawBBoxes(entities.stairs, 'stairs', showLabels);
      if (document.getElementById('showElevators').checked) drawBBoxes(entities.elevators, 'elevator', showLabels);

      if (document.getElementById('showDoors').checked) drawDoors(entities.doors, showLabels);
      if (document.getElementById('showEdges').checked) drawEdges();
      if (document.getElementById('showNodes').checked) drawNodes();
    }
    
    function drawBBoxes(items, type, showLabels) {
      if (!items) return;
      const colors = CONFIG.colors[type];
      items.forEach(item => {
        if (!item.bbox) return;
        const { x, y, width, height } = item.bbox;
        const sx = tx(x, y), sy = ty(x, y);
        const sw = width * scaleX, sh = height * scaleY;

        ctx.fillStyle = colors.fill;
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, sw, sh);

        if (showLabels && item.label) {
          ctx.font = CONFIG.label.fontSize + 'px ' + CONFIG.label.fontFamily;
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.fillText(item.label, sx + sw/2, sy + sh/2 + 3);
        }
      });
    }

    function drawDoors(items, showLabels) {
      if (!items) return;
      
      items.forEach(item => {
        if (!item.bbox) return;
        const { x, y, width, height } = item.bbox;
        
        // Door Geometry Calculation
        // Assumption: width > height means Horizontal Door, otherwise Vertical
        const isHorizontal = width > height;
        
        // Configuration
        const arcRadius = isHorizontal ? width : height;
        const hingeRadius = 4;
        
        ctx.lineWidth = 3;
        
        let hinge, arcCenter, startAngle, endAngle, panelEnd;
        
        if (isHorizontal) {
          // Horizontal Door Strategy:
          // Hinge at (x, y) (Top-Left corner of bbox)
          // Opens UP (Standard plan view assumption, or arbitrary consistent choice)
          hinge = { x: x, y: y };
          arcCenter = { x: tx(hinge.x, hinge.y), y: ty(hinge.x, hinge.y) };
          
          // Arc parameters
          // Swinging from Closed (0 deg) to Open (-90 deg / 270 deg)
          // Canvas angles: 0 is Right, -PI/2 is Up.
          startAngle = 0; 
          endAngle = -Math.PI / 2; // -90 degrees
          
          // Panel Endpoint (Open position)
          panelEnd = { x: tx(x, y - width), y: ty(x, y - width) };
          
        } else {
          // Vertical Door Strategy:
          // Hinge at (x, y) (Top-Left corner)
          // Opens LEFT? Or RIGHT? 
          // Let's assume hinge at Top-Left, swinging Top-Right (like opening a book?)
          // If vertical, usually thin width, tall height.
          // Hinge at (x, y). 
          // Swing from Closed (90 deg / PI/2) (Down) to Open (0 deg) (Right)?
          // Let's try: Hinge at (x, y). Open state is Horizontal-Right. Closed is Vertical-Down.
          
          hinge = { x: x, y: y };
          arcCenter = { x: tx(hinge.x, hinge.y), y: ty(hinge.x, hinge.y) };
          
          startAngle = Math.PI / 2; // 90 deg (Down)
          endAngle = 0; // 0 deg (Right)
          
          panelEnd = { x: tx(x + height, y), y: ty(x + height, y) };
        }

        // Draw Arc
        ctx.beginPath();
        // Check standard: arc(x, y, radius, startAngle, endAngle, counterclockwise?)
        // Arc radius must be scaled to pixel space
        const pixelRadius = arcRadius * Math.max(scaleX, scaleY);
        ctx.arc(arcCenter.x, arcCenter.y, pixelRadius, startAngle, endAngle, true);
        ctx.strokeStyle = "green";
        ctx.stroke();

        // Draw Door Panel (Straight line from hinge to open position)
        ctx.beginPath();
        ctx.moveTo(tx(hinge.x, hinge.y), ty(hinge.x, hinge.y));
        ctx.lineTo(panelEnd.x, panelEnd.y);
        ctx.strokeStyle = "green"; 
        ctx.stroke();

        // Draw Hinge
        ctx.beginPath();
        ctx.arc(tx(hinge.x, hinge.y), ty(hinge.x, hinge.y), hingeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
        
        if (showLabels && item.label) {
          ctx.font = CONFIG.label.fontSize + 'px ' + CONFIG.label.fontFamily;
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.fillText(item.label, tx(x, y) + (width * scaleX)/2, ty(x, y) + (height * scaleY)/2 + 10);
        }
      });
    }
    
    function drawEdges() {
      graph.edges.forEach(e => {
        const from = nodeMap.get(e.from);
        const to = nodeMap.get(e.to);
        if (!from || !to) return;
        ctx.beginPath();
        ctx.moveTo(tx(from.x, from.y), ty(from.x, from.y));
        ctx.lineTo(tx(to.x, to.y), ty(to.x, to.y));
        ctx.strokeStyle = e.type === 'vertical' ? CONFIG.edge.verticalColor : CONFIG.edge.color;
        ctx.lineWidth = e.type === 'vertical' ? CONFIG.edge.verticalWidth : CONFIG.edge.width;
        ctx.stroke();
      });
    }
    
    function drawNodes() {
      graph.nodes.forEach(n => {
        const colors = CONFIG.colors[n.type] || CONFIG.colors.room;
        ctx.beginPath();
        ctx.arc(tx(n.x, n.y), ty(n.x, n.y), CONFIG.node.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.stroke;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    
    // Controls
    document.getElementById('fitBtn').onclick = fitToView;
    document.getElementById('zoomInBtn').onclick = () => { zoom = Math.min(zoom * 1.3, 5); updateTransform(); };
    document.getElementById('zoomOutBtn').onclick = () => { zoom = Math.max(zoom / 1.3, 0.1); updateTransform(); };
    document.getElementById('resetBtn').onclick = () => { zoom = 1; panX = 0; panY = 0; updateTransform(); };
    
    document.querySelectorAll('.toolbar input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', render);
    });
    
    // Pan with mouse drag
    container.addEventListener('mousedown', e => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      container.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mousemove', e => {
      if (isDragging) {
        panX += e.clientX - lastMouseX;
        panY += e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        updateTransform();
      }
    });
    
    window.addEventListener('mouseup', () => {
      isDragging = false;
      container.style.cursor = 'grab';
    });
    
    container.style.cursor = 'grab';
    
    // Zoom with scroll
    container.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
      updateTransform();
    });
    
    // Hover
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      let nearest = null;
      let minDist = 15;
      graph.nodes.forEach(n => {
        const dist = Math.sqrt((tx(n.x, n.y) - x) ** 2 + (ty(n.x, n.y) - y) ** 2);
        if (dist < minDist) { minDist = dist; nearest = n; }
      });
      
      if (nearest) {
        hoverInfo.innerHTML = '<b>' + (nearest.metadata?.label || nearest.id) + '</b><br>Type: ' + nearest.type + '<br>Pos: (' + nearest.x + ', ' + nearest.y + ')';
      } else {
        hoverInfo.textContent = 'Move cursor over nodes to see details.';
      }
    });
  </script>
</body>
</html>`;
}

function extractEntitiesFromNodes(nodes) {
  return {
    rooms: nodes.filter(n => n.type === 'room').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
    halls: nodes.filter(n => n.type === 'hall').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
    stairs: nodes.filter(n => n.type === 'stairs').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
    elevators: nodes.filter(n => n.type === 'elevator').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox })),
    doors: nodes.filter(n => n.type === 'door').map(n => ({ id: n.id, label: n.metadata?.label, bbox: n.metadata?.bbox }))
  };
}

function getImageDimensions(buffer) {
  try {
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) {
          return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
    return null;
  } catch (e) { return null; }
}

function renderVisualization(options = {}) {
  const {
    scanPath = './Shared/BuildingPacks/dummy_university/floor1-scan.json',
    imagePath = null,
    outputPath = './renderVisualization.html'
  } = options;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎨 Floor Plan Visualization Renderer');
  console.log('═══════════════════════════════════════════════════════════\n');

  const scanFullPath = path.resolve(scanPath);
  console.log('📂 Loading scan:', scanFullPath);

  if (!fs.existsSync(scanFullPath)) throw new Error('Floor scan not found: ' + scanFullPath);

  const floorScan = JSON.parse(fs.readFileSync(scanFullPath, 'utf-8'));
  console.log('   ✅ Loaded:', floorScan.graph?.nodes?.length || 0, 'nodes,', floorScan.graph?.edges?.length || 0, 'edges');

  let resolvedImagePath = imagePath;
  if (!resolvedImagePath && floorScan.source) {
    const possiblePaths = [
      resolvedImagePath,
      path.join(path.dirname(scanFullPath), '..', 'SampleFloorPlans', floorScan.source),
      path.join(path.dirname(scanFullPath), floorScan.source),
      // Add explicit check for the complex path user provided
      path.join(__dirname, 'Shared', 'SampleFloorPlans', 'dummy university', 'University Hall_0', floorScan.source),
      path.join(__dirname, 'Shared', 'SampleFloorPlans', floorScan.source)
    ];
    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) { resolvedImagePath = p; break; }
    }
  }

  if (resolvedImagePath) console.log('🖼️  Image:', resolvedImagePath);
  else console.log('⚠️  No image found');

  console.log('\n🎨 Generating HTML...');
  const html = generateHTML(floorScan, resolvedImagePath);

  const outputFullPath = path.resolve(outputPath);
  fs.writeFileSync(outputFullPath, html, 'utf-8');
  console.log('💾 Saved:', outputFullPath);
  console.log('\n✅ Done! Open: file://' + outputFullPath.replace(/\\/g, '/') + '\n');

  return { success: true, outputPath: outputFullPath };
}

module.exports = { renderVisualization, generateHTML, CONFIG };

if (require.main === module) {
  const args = process.argv.slice(2);
  try {
    renderVisualization({
      scanPath: args[0] || './Shared/BuildingPacks/dummy_university/floor1-scan.json',
      imagePath: args[1] || null,
      outputPath: args[2] || './renderVisualization.html'
    });
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}
