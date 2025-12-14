# 🏛️ Dummy Floor Plan - University Level 1

This document describes the dummy floor plan used for testing and development.

## 📐 Floor Plan Overview

**Building:** University Building  
**Level:** Level 1 (Ground Floor)  
**Orientation:** North at top  
**Dimensions:** Approximately 1000 x 800 pixels

## 🚪 Main Entrance

- **Location:** Bottom center of the plan
- **Type:** Main entrance/exit
- **Connects to:** Central area of building

## 🛤️ Main Corridor

A prominent **horizontal corridor** runs across the upper-middle section of the plan, connecting various rooms.

**Rooms along Main Corridor (from left to right):**
1. Lecture Hall 1
2. Lecture Hall 3
3. Lecture Hall 4
4. Computer Lab
5. Science Lab (Biology)
6. Science Lab (Chemistry)
7. Computer Lab (second)
8. Cafeteria

## 🏠 Room Inventory

### Lecture Halls
- **Lecture Hall 1** (1 instance) - Top-left corner
- **Lecture Hall 3** (3 instances) - Various locations
- **Lecture Hall 4** (2 instances) - Top corridor and bottom-left

### Laboratories
- **Computer Lab** (2 instances) - Along main corridor
- **Science Lab (Biology)** - Top section
- **Science Lab (Chemistry)** - Top section

### Library Facilities
- **Library** - Large room in bottom-left/central area
  - Study Area
  - Stacks (book storage)
  - Circulation Desk

### Offices
- **Administration Office** - Right side, near entrance
- **IT Services** - Right side, below administration

### Common Areas
- **Faculty Lounge** - Left side, above men's restroom
- **Cafeteria** - Top-right corner
- **Student Center** - Right side, central area
- **Auditorium** - Large room, right side

### Restrooms
- **Men's Restroom** - Left side, near entrance (in TOILET room)
- **Women's Restroom** - Right side, near entrance

## 🗺️ Building Layout

### Left Wing (West Side)
- Lecture halls arranged vertically
- Connects to main corridor and central area
- Library access

### Central Area
- Main entrance
- Restrooms
- Faculty lounge
- Administration office
- Library connection

### Right Wing (East Side)
- IT Services
- Student Center
- Auditorium
- Cafeteria access

### Top Section
- Main corridor
- Multiple lecture halls
- Laboratories
- Cafeteria

## 📊 Sample Data

Sample scan result data is available in:
- `Shared/SampleFloorPlans/university-level1-scan.json`

This file contains:
- Room definitions with bounds
- Path/corridor definitions
- Metadata and coordinate system

## 🧪 Testing Use Cases

This dummy floor plan supports testing:

1. **Room Detection**
   - Multiple room types
   - Duplicate room names (Lecture Hall 3, 4)
   - Various sizes

2. **Path Detection**
   - Main corridor
   - Branching pathways
   - Vertical and horizontal paths

3. **Graph Building**
   - Multiple nodes
   - Complex connections
   - Room-to-corridor mappings

4. **Pathfinding**
   - Long paths (entrance to top rooms)
   - Short paths (adjacent rooms)
   - Complex routing (through corridors)

5. **Point Selection**
   - Multiple start points (entrance, corridors)
   - Multiple end points (rooms, offices, facilities)

6. **Visualization**
   - Large floor plan
   - Multiple room types
   - Complex path network

## 📝 Notes

- Coordinates are approximate based on floor plan description
- Room sizes are estimated
- Path segments connect major areas
- This is test/dummy data for development

---

**Use this floor plan for testing all navigation system components!** 🧪

