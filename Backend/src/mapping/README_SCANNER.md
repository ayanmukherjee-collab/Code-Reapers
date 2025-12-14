# 🔍 Floor Plan Scanner

The **scan phase** converts raw floor plan input into structured, deterministic data.

## 📋 What It Does

Extracts:
- **Rooms** → Bounding boxes (rectangles)
- **Walkable paths** → Line segments or polylines

Output is:
- ✅ **Structured** - Well-defined JSON schema
- ✅ **Deterministic** - Same input → Same output
- ✅ **Reproducible** - IDs based on content, not random
- ✅ **Partial results OK** - Confidence scores indicate quality

## 🚀 Quick Start

```javascript
const { scanFloorPlan } = require('./scanner');

// Scan SVG
const svgInput = `
  <svg width="500" height="400">
    <rect x="100" y="200" width="50" height="40" class="room" id="ROOM_101"/>
    <path d="M 150 220 L 300 220" class="corridor" stroke-width="10"/>
  </svg>
`;

const result = scanFloorPlan(svgInput, { source: 'floor-plan.svg' });

console.log(result.rooms);    // Array of room objects
console.log(result.paths);     // Array of path objects
console.log(result.metadata);  // Scan metadata
```

## 📥 Input Formats

### SVG Format

```xml
<svg width="500" height="400">
  <!-- Rooms -->
  <rect x="100" y="200" width="50" height="40" class="room" id="ROOM_101"/>
  <text x="125" y="225">101</text>
  
  <!-- Corridors -->
  <path d="M 150 220 L 300 220" class="corridor" stroke-width="10"/>
  <line x1="150" y1="220" x2="300" y2="220" class="corridor"/>
</svg>
```

**Supported elements:**
- `<rect class="room">` - Rectangular rooms
- `<polygon class="room">` - Polygonal rooms (converted to bounding box)
- `<path class="corridor">` - Corridor paths
- `<line class="corridor">` - Straight corridor lines
- `<polyline class="corridor">` - Polyline corridors
- `<text>` - Room labels (automatically associated with nearby rooms)

### JSON Format

```json
{
  "rooms": [
    {
      "id": "ROOM_101",
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 40,
      "label": "101"
    }
  ],
  "corridors": [
    {
      "id": "CORR_001",
      "points": [[150, 220], [300, 220]],
      "width": 10
    }
  ]
}
```

## 📤 Output Schema

```typescript
{
  metadata: {
    source: string;        // Input identifier
    timestamp: string;      // ISO timestamp
    version: string;        // Scanner version
    bounds: {               // Overall floor plan bounds
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  rooms: [
    {
      id: string;           // Deterministic ID
      bounds: {             // Bounding box
        x: number;
        y: number;
        width: number;
        height: number;
      };
      label?: string;       // Room number/name
      type: string;         // "room", "office", "stair", etc.
      confidence: number;   // 0-1 confidence score
    }
  ];
  paths: [
    {
      id: string;           // Deterministic ID
      type: string;         // "corridor", "hallway", etc.
      segments: [           // Line segments
        {
          start: { x: number; y: number; };
          end: { x: number; y: number; };
        }
      ];
      width?: number;      // Approximate width
      confidence: number;   // 0-1 confidence score
    }
  ];
  warnings: string[];       // Non-fatal issues
  errors: string[];         // Fatal issues
}
```

## 🎯 Deterministic Guarantees

### Same Input → Same Output

The scanner guarantees:
1. **Same file content** → Same room IDs
2. **Same file content** → Same path IDs
3. **Same file content** → Same element order
4. **Same file content** → Same coordinates (normalized)

### How It Works

- **Content-based IDs:** IDs generated from bounds/coordinates
- **Normalized coordinates:** Fixed precision (2 decimal places)
- **Sorted output:** Consistent element ordering
- **No randomness:** No random numbers in IDs

### Example

```javascript
const svg = '<svg><rect x="100" y="200" width="50" height="40" class="room"/></svg>';

const result1 = scanFloorPlan(svg);
const result2 = scanFloorPlan(svg);

// result1.rooms[0].id === result2.rooms[0].id  // ✅ Always true
```

## ⚙️ Configuration

### Options

```javascript
scanFloorPlan(input, {
  source: 'floor-plan.svg',  // Source identifier
  // Future: minRoomArea, minPathLength, etc.
});
```

### Constants

```javascript
const COORDINATE_PRECISION = 2;    // Decimal places
const MIN_ROOM_AREA = 100;          // Minimum room area (pixels²)
const MIN_PATH_LENGTH = 20;         // Minimum path length (pixels)
```

## 🔧 Dependencies

### Required
- None (pure JavaScript)

### Optional (for better SVG parsing)
- `@xmldom/xmldom` - For proper XML/SVG parsing in Node.js

```bash
npm install @xmldom/xmldom
```

Without this package, the scanner falls back to regex-based parsing (limited functionality).

## 📝 Examples

See `scanner.example.js` for complete examples:
- SVG scanning
- JSON scanning
- Determinism verification
- Partial results handling

## ⚠️ Limitations

### Current Limitations

1. **SVG Parsing:**
   - Basic path command support (M, L only)
   - Complex curves approximated as line segments
   - No support for transforms/rotations

2. **Room Detection:**
   - Only rectangular/polygonal shapes
   - Complex curved rooms converted to bounding boxes

3. **Path Detection:**
   - Short paths (< 20px) are filtered out
   - Curved paths approximated as line segments

### Acceptable for Hackathon

- ✅ Partial results are OK
- ✅ Approximate bounds are OK
- ✅ Confidence scores indicate quality
- ✅ Warnings indicate non-fatal issues

## 🔄 Next Steps

After scanning:
1. **Graph Building** - Convert rooms + paths → navigation graph
2. **Node Placement** - Place navigation nodes at key points
3. **Edge Generation** - Connect nodes based on rooms/paths
4. **Pathfinding** - A* algorithm on the graph

## 📚 Related Documentation

- `Docs/SCAN_PHASE_DESIGN.md` - Detailed design document
- `Docs/AR_FLOOR_PLAN_ASSUMPTIONS.md` - Floor plan assumptions
- `Shared/schemas/scanResult.schema.json` - JSON schema

## 🐛 Troubleshooting

### "No rooms or paths found"

- Check that SVG elements have `class="room"` or `class="corridor"`
- Verify coordinates are valid numbers
- Check minimum size thresholds (MIN_ROOM_AREA, MIN_PATH_LENGTH)

### "SVG parsing failed"

- Install `@xmldom/xmldom` for better parsing
- Check SVG is well-formed XML
- Try regex fallback mode (automatic)

### "Non-deterministic IDs"

- Ensure same input is used
- Check coordinate normalization is working
- Verify sorting is applied

---

**Built for hackathon speed. Designed for determinism. Ready for graph building.** 🚀

