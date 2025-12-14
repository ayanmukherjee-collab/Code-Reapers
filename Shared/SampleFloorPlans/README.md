# Sample Floor Plans

This directory contains sample floor plan data for testing and development.

## University Level 1 Floor Plan

**File:** `university-level1-scan.json`

This is a dummy floor plan representing a university building's first level.

### Building Layout

- **Main Entrance:** Bottom center
- **Main Corridor:** Horizontal corridor running across the top section
- **North Orientation:** Compass rose indicates North at top

### Room Types and Counts

#### Lecture Halls
- Lecture Hall 1 (1)
- Lecture Hall 3 (3 instances)
- Lecture Hall 4 (2 instances)

#### Laboratories
- Computer Lab (2)
- Science Lab (Biology) (1)
- Science Lab (Chemistry) (1)

#### Library Facilities
- Library (main area with study area, stacks, circulation desk)

#### Offices
- Administration Office
- IT Services

#### Common Areas
- Faculty Lounge
- Cafeteria
- Student Center
- Auditorium

#### Restrooms
- Men's Restroom (in TOILET room)
- Women's Restroom

### Coordinate System

- **Origin:** Top-left corner (0, 0)
- **Units:** Pixels
- **Bounds:** 1000 x 800 pixels
- **North:** Top of the plan

### Path Structure

The floor plan includes:
- Main corridor (horizontal, top section)
- Entrance to center connection
- Left wing vertical pathway
- Center horizontal pathway
- Library access pathway
- Right wing pathway

### Usage

This sample data can be used for:
- Testing the scanner
- Testing graph building
- Testing pathfinding
- Testing visualization
- Testing navigation point selection
- Testing summary generation

### Example Usage

```javascript
const scanResult = require('./university-level1-scan.json');

// Use with scanner (if needed)
// Use with graph builder
// Use with pathfinder
// Use with visualization generator
// Use with summary generator
```

---

**Note:** This is dummy/test data. Coordinates are approximate and based on the floor plan description.

