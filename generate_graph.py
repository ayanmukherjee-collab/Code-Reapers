import json



# Canvas dimensions

WIDTH = 1600

HEIGHT = 900



nodes = []

edges = []

rooms = []

walls = []

doors = []



node_id = 0



def add_node(x, y, node_type, name=""):

    global node_id

    nid = f"node_{node_id}"

    node_id += 1

    nodes.append({"id": nid, "x": x, "y": y, "type": node_type, "name": name})

    return nid



def add_edge(source, target):

    edges.append({"source": source, "target": target, "weight": 1})



def add_room(room_id, name, x1, y1, x2, y2):

    rooms.append({

        "id": room_id,

        "name": name,

        "position": {

            "start": {"x": x1, "y": y1},

            "end": {"x": x2, "y": y2}

        }

    })



def add_wall(x1, y1, x2, y2):

    walls.append({

        "position": {

            "start": {"x": x1, "y": y1},

            "end": {"x": x2, "y": y2}

        }

    })



def add_door(x, y, width=30):

    doors.append({

        "position": {"x": x, "y": y},

        "width": width

    })



# Building parameters

MARGIN = 40

CORRIDOR_WIDTH = 60



# Main building bounds

building_x1 = MARGIN

building_y1 = MARGIN

building_x2 = WIDTH - MARGIN

building_y2 = HEIGHT - MARGIN



# ========== OUTER WALLS ==========

add_wall(building_x1, building_y1, building_x2, building_y1)

add_wall(building_x1, building_y2, building_x2, building_y2)

add_wall(building_x1, building_y1, building_x1, building_y2)

add_wall(building_x2, building_y1, building_x2, building_y2)



# ========== CORRIDOR LAYOUT (Complex Grid) ==========



# Vertical corridors

v1 = 200   # Far left

v2 = 380   # Left

v3 = 560   # Center-left

v4 = 740   # Center

v5 = 860   # Center

v6 = 1040  # Center-right

v7 = 1220  # Right

v8 = 1400  # Far right



# Horizontal corridors

h1 = 140   # Top

h2 = 260   # Upper-mid

h3 = 380   # Center-top

h4 = 470   # Center

h5 = 560   # Center-bottom

h6 = 680   # Lower-mid

h7 = 800   # Bottom



# ========== CORRIDOR WALLS ==========



# Vertical corridor walls

for v in [v1, v2, v3, v4, v5, v6, v7, v8]:

    if v == v4 or v == v5:  # Main central corridors

        add_wall(v, building_y1, v, h3)

        add_wall(v, h5, v, building_y2)

    else:

        add_wall(v, building_y1, v, h1)

        add_wall(v, h2, v, h3)

        add_wall(v, h5, v, h6)

        add_wall(v, h7, v, building_y2)



# Horizontal corridor walls

for h in [h1, h2, h3, h4, h5, h6, h7]:

    if h == h4:  # Main central corridor

        add_wall(building_x1, h, v4, h)

        add_wall(v5, h, building_x2, h)

    else:

        add_wall(building_x1, h, v1, h)

        add_wall(v2, h, v3, h)

        add_wall(v4, h, v5, h)

        add_wall(v6, h, v7, h)

        add_wall(v8, h, building_x2, h)



# ========== JUNCTION NODES ==========
# Junction nodes are placed EXACTLY at corridor intersections (v × h points)

junctions = {}

# Create junctions at all v × h intersections
v_corridors = [v1, v2, v3, v4, v5, v6, v7, v8]
h_corridors = [h1, h2, h3, h4, h5, h6, h7]

# Store junction references for easy access
j_grid = {}

for h in h_corridors:
    for v in v_corridors:
        j_id = add_node(v, h, "junction")
        j_grid[(v, h)] = j_id

# Add edge entrance junctions
j_left = add_node(building_x1, h4, "junction", "West Entry")
j_right = add_node(building_x2, h4, "junction", "East Entry")
j_top = add_node(v4, building_y1, "junction", "North Entry")
j_bottom = add_node(v4, building_y2, "junction", "South Entry")

# Connect all horizontal corridors
for h in h_corridors:
    for i in range(len(v_corridors) - 1):
        add_edge(j_grid[(v_corridors[i], h)], j_grid[(v_corridors[i+1], h)])

# Connect all vertical corridors
for v in v_corridors:
    for i in range(len(h_corridors) - 1):
        add_edge(j_grid[(v, h_corridors[i])], j_grid[(v, h_corridors[i+1])])

# Connect edge entrances
add_edge(j_left, j_grid[(v1, h4)])
add_edge(j_right, j_grid[(v8, h4)])
add_edge(j_top, j_grid[(v4, h1)])
add_edge(j_bottom, j_grid[(v4, h7)])

# Alias common junctions for room connections
j_t2 = j_grid[(v1, h1)]
j_t3 = j_grid[(v2, h1)]
j_t4 = j_grid[(v3, h1)]
j_t5 = j_grid[(v4, h1)]
j_t6 = j_grid[(v6, h1)]
j_t7 = j_grid[(v7, h1)]
j_t8 = j_grid[(v8, h1)]

j_um1 = j_grid[(v1, h2)]
j_um2 = j_grid[(v2, h2)]
j_um3 = j_grid[(v3, h2)]
j_um4 = j_grid[(v4, h2)]
j_um5 = j_grid[(v6, h2)]
j_um6 = j_grid[(v7, h2)]
j_um7 = j_grid[(v8, h2)]

j_ct2 = j_grid[(v1, h3)]
j_ct3 = j_grid[(v2, h3)]
j_ct4 = j_grid[(v3, h3)]
j_ct5 = j_grid[(v4, h3)]
j_ct6 = j_grid[(v6, h3)]
j_ct7 = j_grid[(v7, h3)]
j_ct8 = j_grid[(v8, h3)]

j_center = j_grid[(v4, h4)]
j_c2 = j_grid[(v1, h4)]
j_c3 = j_grid[(v2, h4)]
j_c4 = j_grid[(v3, h4)]
j_c6 = j_grid[(v6, h4)]
j_c7 = j_grid[(v7, h4)]
j_c8 = j_grid[(v8, h4)]
j_c9 = j_right  # For edge rooms on the right

j_cb2 = j_grid[(v1, h5)]
j_cb3 = j_grid[(v2, h5)]
j_cb4 = j_grid[(v3, h5)]
j_cb5 = j_grid[(v4, h5)]
j_cb6 = j_grid[(v6, h5)]
j_cb7 = j_grid[(v7, h5)]
j_cb8 = j_grid[(v8, h5)]

j_lm1 = j_grid[(v1, h6)]
j_lm2 = j_grid[(v2, h6)]
j_lm3 = j_grid[(v3, h6)]
j_lm4 = j_grid[(v4, h6)]
j_lm5 = j_grid[(v6, h6)]
j_lm6 = j_grid[(v7, h6)]
j_lm7 = j_grid[(v8, h6)]

j_b2 = j_grid[(v1, h7)]
j_b3 = j_grid[(v2, h7)]
j_b4 = j_grid[(v3, h7)]
j_b5 = j_grid[(v4, h7)]
j_b6 = j_grid[(v6, h7)]
j_b7 = j_grid[(v7, h7)]
j_b8 = j_grid[(v8, h7)]
j_b9 = j_right  # For edge rooms on bottom-right



# ========== ROOMS ==========



# Row 1 (Top) - 8 rooms

r1 = add_node(120, 90, "room", "Room 101")

add_room(r1, "Room 101", building_x1 + 5, building_y1 + 5, v1 - 5, h1 - 5)

add_wall(building_x1 + 5, building_y1 + 5, v1 - 5, building_y1 + 5)

add_wall(building_x1 + 5, building_y1 + 5, building_x1 + 5, h1 - 5)

add_wall(v1 - 5, building_y1 + 5, v1 - 5, h1 - 5)

add_edge(r1, j_t2)

add_door(v1 - 3, 90)



r2 = add_node(290, 90, "room", "Computer Lab 1")

add_room(r2, "Computer Lab 1", v1 + 5, building_y1 + 5, v2 - 5, h1 - 5)

add_wall(v1 + 5, building_y1 + 5, v2 - 5, building_y1 + 5)

add_edge(r2, j_t3)

add_door(290, h1 - 3)



r3 = add_node(470, 90, "room", "Room 103")

add_room(r3, "Room 103", v2 + 5, building_y1 + 5, v3 - 5, h1 - 5)

add_wall(v2 + 5, building_y1 + 5, v3 - 5, building_y1 + 5)

add_edge(r3, j_t4)

add_door(470, h1 - 3)



r4 = add_node(650, 90, "room", "Lecture Hall A")

add_room(r4, "Lecture Hall A", v3 + 5, building_y1 + 5, v4 - 5, h1 - 5)

add_wall(v3 + 5, building_y1 + 5, v4 - 5, building_y1 + 5)

add_edge(r4, j_t5)

add_door(650, h1 - 3)



r5 = add_node(950, 90, "room", "Physics Lab")

add_room(r5, "Physics Lab", v5 + 5, building_y1 + 5, v6 - 5, h1 - 5)

add_wall(v5 + 5, building_y1 + 5, v6 - 5, building_y1 + 5)

add_edge(r5, j_t6)

add_door(950, h1 - 3)



r6 = add_node(1130, 90, "room", "Room 106")

add_room(r6, "Room 106", v6 + 5, building_y1 + 5, v7 - 5, h1 - 5)

add_wall(v6 + 5, building_y1 + 5, v7 - 5, building_y1 + 5)

add_edge(r6, j_t7)

add_door(1130, h1 - 3)



r7 = add_node(1310, 90, "room", "Library")

add_room(r7, "Library", v7 + 5, building_y1 + 5, v8 - 5, h1 - 5)

add_wall(v7 + 5, building_y1 + 5, v8 - 5, building_y1 + 5)

add_edge(r7, j_t8)

add_door(1310, h1 - 3)



r8 = add_node(1480, 90, "room", "Room 108")

add_room(r8, "Room 108", v8 + 5, building_y1 + 5, building_x2 - 5, h1 - 5)

add_wall(v8 + 5, building_y1 + 5, building_x2 - 5, building_y1 + 5)

add_wall(building_x2 - 5, building_y1 + 5, building_x2 - 5, h1 - 5)

add_edge(r8, j_t8)

add_door(v8 + 3, 90)



# Row 2 - 7 rooms

r9 = add_node(290, 200, "room", "Faculty Office 1")

add_room(r9, "Faculty Office 1", v1 + 5, h1 + 5, v2 - 5, h2 - 5)

add_edge(r9, j_um1)

add_door(290, h2 - 3)



r10 = add_node(470, 200, "room", "Room 110")

add_room(r10, "Room 110", v2 + 5, h1 + 5, v3 - 5, h2 - 5)

add_edge(r10, j_um2)

add_door(470, h2 - 3)



r11 = add_node(650, 200, "room", "Classroom 1")

add_room(r11, "Classroom 1", v3 + 5, h1 + 5, v4 - 5, h2 - 5)

add_edge(r11, j_um3)

add_door(650, h2 - 3)



r12 = add_node(950, 200, "room", "Classroom 2")

add_room(r12, "Classroom 2", v5 + 5, h1 + 5, v6 - 5, h2 - 5)

add_edge(r12, j_um4)

add_door(950, h2 - 3)



r13 = add_node(1130, 200, "room", "Study Room 1")

add_room(r13, "Study Room 1", v6 + 5, h1 + 5, v7 - 5, h2 - 5)

add_edge(r13, j_um5)

add_door(1130, h2 - 3)



r14 = add_node(1310, 200, "room", "Reading Room")

add_room(r14, "Reading Room", v7 + 5, h1 + 5, v8 - 5, h2 - 5)

add_edge(r14, j_um6)

add_door(1310, h2 - 3)



r15 = add_node(1480, 200, "room", "Archives")

add_room(r15, "Archives", v8 + 5, h1 + 5, building_x2 - 5, h2 - 5)

add_wall(building_x2 - 5, h1 + 5, building_x2 - 5, h2 - 5)

add_edge(r15, j_um7)

add_door(v8 + 3, 200)



# Row 3 - 8 rooms

r16 = add_node(120, 320, "room", "Storage")

add_room(r16, "Storage", building_x1 + 5, h2 + 5, v1 - 5, h3 - 5)

add_wall(building_x1 + 5, h2 + 5, building_x1 + 5, h3 - 5)

add_edge(r16, j_ct2)

add_door(v1 - 3, 320)



r17 = add_node(290, 320, "room", "Faculty Office 2")

add_room(r17, "Faculty Office 2", v1 + 5, h2 + 5, v2 - 5, h3 - 5)

add_edge(r17, j_ct3)

add_door(290, h3 - 3)



r18 = add_node(470, 320, "room", "Computer Lab 2")

add_room(r18, "Computer Lab 2", v2 + 5, h2 + 5, v3 - 5, h3 - 5)

add_edge(r18, j_ct4)

add_door(470, h3 - 3)



r19 = add_node(650, 320, "room", "Lecture Hall B")

add_room(r19, "Lecture Hall B", v3 + 5, h2 + 5, v4 - 5, h3 - 5)

add_edge(r19, j_ct5)

add_door(650, h3 - 3)



r20 = add_node(950, 320, "room", "Chemistry Lab")

add_room(r20, "Chemistry Lab", v5 + 5, h2 + 5, v6 - 5, h3 - 5)

add_edge(r20, j_ct6)

add_door(950, h3 - 3)



r21 = add_node(1130, 320, "room", "Lab Prep Room")

add_room(r21, "Lab Prep Room", v6 + 5, h2 + 5, v7 - 5, h3 - 5)

add_edge(r21, j_ct7)

add_door(1130, h3 - 3)



r22 = add_node(1310, 320, "room", "Dean's Office")

add_room(r22, "Dean's Office", v7 + 5, h2 + 5, v8 - 5, h3 - 5)

add_edge(r22, j_ct8)

add_door(1310, h3 - 3)



r23 = add_node(1480, 320, "room", "Admin Office 1")

add_room(r23, "Admin Office 1", v8 + 5, h2 + 5, building_x2 - 5, h3 - 5)

add_wall(building_x2 - 5, h2 + 5, building_x2 - 5, h3 - 5)

add_edge(r23, j_c8)

add_door(v8 + 3, 320)



# Row 4 (Center) - 7 rooms + central common area

r24 = add_node(120, 425, "room", "Cafeteria")

add_room(r24, "Cafeteria", building_x1 + 5, h3 + 5, v1 - 5, h5 - 5)

add_wall(building_x1 + 5, h3 + 5, building_x1 + 5, h5 - 5)

add_edge(r24, j_c2)

add_door(v1 - 3, 425)



r25 = add_node(290, 425, "room", "Kitchen")

add_room(r25, "Kitchen", v1 + 5, h3 + 5, v2 - 5, h5 - 5)

add_edge(r25, j_c3)

add_door(290, h3 + 3)



r26 = add_node(470, 425, "room", "Dining Hall")

add_room(r26, "Dining Hall", v2 + 5, h3 + 5, v3 - 5, h5 - 5)

add_edge(r26, j_c4)

add_door(470, h3 + 3)



# Central common area

r_center = add_node(800, 425, "room", "Reception Lobby")

add_room(r_center, "Reception Lobby", v4 + 5, h3 + 5, v5 - 5, h5 - 5)

add_edge(r_center, j_center)



r27 = add_node(950, 425, "room", "Conference Room")

add_room(r27, "Conference Room", v5 + 5, h3 + 5, v6 - 5, h5 - 5)

add_edge(r27, j_c6)

add_door(950, h3 + 3)



r28 = add_node(1130, 425, "room", "Meeting Room")

add_room(r28, "Meeting Room", v6 + 5, h3 + 5, v7 - 5, h5 - 5)

add_edge(r28, j_c7)

add_door(1130, h3 + 3)



r29 = add_node(1310, 425, "room", "Admin Office 2")

add_room(r29, "Admin Office 2", v7 + 5, h3 + 5, v8 - 5, h5 - 5)

add_edge(r29, j_c8)

add_door(1310, h3 + 3)



r30 = add_node(1480, 425, "room", "HR Office")

add_room(r30, "HR Office", v8 + 5, h3 + 5, building_x2 - 5, h5 - 5)

add_wall(building_x2 - 5, h3 + 5, building_x2 - 5, h5 - 5)

add_edge(r30, j_c9)

add_door(v8 + 3, 425)



# Row 5 - 8 rooms

r31 = add_node(120, 620, "room", "Student Lounge")

add_room(r31, "Student Lounge", building_x1 + 5, h5 + 5, v1 - 5, h6 - 5)

add_wall(building_x1 + 5, h5 + 5, building_x1 + 5, h6 - 5)

add_edge(r31, j_cb2)

add_door(v1 - 3, 620)



r32 = add_node(290, 620, "room", "Game Room")

add_room(r32, "Game Room", v1 + 5, h5 + 5, v2 - 5, h6 - 5)

add_edge(r32, j_cb3)

add_door(290, h5 + 3)



r33 = add_node(470, 620, "room", "Study Room 2")

add_room(r33, "Study Room 2", v2 + 5, h5 + 5, v3 - 5, h6 - 5)

add_edge(r33, j_cb4)

add_door(470, h5 + 3)



r34 = add_node(650, 620, "room", "Lecture Hall C")

add_room(r34, "Lecture Hall C", v3 + 5, h5 + 5, v4 - 5, h6 - 5)

add_edge(r34, j_cb5)

add_door(650, h5 + 3)



r35 = add_node(950, 620, "room", "Biology Lab")

add_room(r35, "Biology Lab", v5 + 5, h5 + 5, v6 - 5, h6 - 5)

add_edge(r35, j_cb6)

add_door(950, h5 + 3)



r36 = add_node(1130, 620, "room", "Anatomy Room")
add_room(r36, "Anatomy Room", v6 + 5, h5 + 5, v7 - 5, h6 - 5)
add_edge(r36, j_cb7)
add_door(1130, h5 + 3)

r37 = add_node(1310, 620, "room", "Medical Lab")
add_room(r37, "Medical Lab", v7 + 5, h5 + 5, v8 - 5, h6 - 5)
add_edge(r37, j_cb8)
add_door(1310, h5 + 3)

r38 = add_node(1480, 620, "room", "Pharmacy Lab")
add_room(r38, "Pharmacy Lab", v8 + 5, h5 + 5, building_x2 - 5, h6 - 5)
add_wall(building_x2 - 5, h5 + 5, building_x2 - 5, h6 - 5)
add_edge(r38, j_cb8)
add_door(v8 + 3, 620)

# Row 6 - 7 rooms
r39 = add_node(290, 740, "room", "Gymnasium")
add_room(r39, "Gymnasium", v1 + 5, h6 + 5, v2 - 5, h7 - 5)
add_edge(r39, j_lm1)
add_door(290, h7 - 3)

r40 = add_node(470, 740, "room", "Sports Equipment")
add_room(r40, "Sports Equipment", v2 + 5, h6 + 5, v3 - 5, h7 - 5)
add_edge(r40, j_lm2)
add_door(470, h7 - 3)

r41 = add_node(650, 740, "room", "Music Room")
add_room(r41, "Music Room", v3 + 5, h6 + 5, v4 - 5, h7 - 5)
add_edge(r41, j_lm3)
add_door(650, h7 - 3)

r42 = add_node(950, 740, "room", "Art Studio")
add_room(r42, "Art Studio", v5 + 5, h6 + 5, v6 - 5, h7 - 5)
add_edge(r42, j_lm4)
add_door(950, h7 - 3)

r43 = add_node(1130, 740, "room", "Drama Theater")
add_room(r43, "Drama Theater", v6 + 5, h6 + 5, v7 - 5, h7 - 5)
add_edge(r43, j_lm5)
add_door(1130, h7 - 3)

r44 = add_node(1310, 740, "room", "Media Lab")
add_room(r44, "Media Lab", v7 + 5, h6 + 5, v8 - 5, h7 - 5)
add_edge(r44, j_lm6)
add_door(1310, h7 - 3)

r45 = add_node(1480, 740, "room", "Broadcasting Studio")
add_room(r45, "Broadcasting Studio", v8 + 5, h6 + 5, building_x2 - 5, h7 - 5)
add_wall(building_x2 - 5, h6 + 5, building_x2 - 5, h7 - 5)
add_edge(r45, j_lm7)
add_door(v8 + 3, 740)

# Row 7 (Bottom) - 8 rooms
r46 = add_node(120, 830, "room", "Restroom 1")
add_room(r46, "Restroom 1", building_x1 + 5, h7 + 5, v1 - 5, building_y2 - 5)
add_wall(building_x1 + 5, h7 + 5, building_x1 + 5, building_y2 - 5)
add_wall(building_x1 + 5, building_y2 - 5, v1 - 5, building_y2 - 5)
add_edge(r46, j_b2)
add_door(v1 - 3, 830)

r47 = add_node(290, 830, "room", "Maintenance")
add_room(r47, "Maintenance", v1 + 5, h7 + 5, v2 - 5, building_y2 - 5)
add_wall(v1 + 5, building_y2 - 5, v2 - 5, building_y2 - 5)
add_edge(r47, j_b2)
add_door(290, h7 + 3)

r48 = add_node(470, 830, "room", "Janitor's Closet")
add_room(r48, "Janitor's Closet", v2 + 5, h7 + 5, v3 - 5, building_y2 - 5)
add_wall(v2 + 5, building_y2 - 5, v3 - 5, building_y2 - 5)
add_edge(r48, j_b3)
add_door(470, h7 + 3)

r49 = add_node(650, 830, "room", "Server Room")
add_room(r49, "Server Room", v3 + 5, h7 + 5, v4 - 5, building_y2 - 5)
add_wall(v3 + 5, building_y2 - 5, v4 - 5, building_y2 - 5)
add_edge(r49, j_b4)
add_door(650, h7 + 3)

r50 = add_node(950, 830, "room", "IT Support")
add_room(r50, "IT Support", v5 + 5, h7 + 5, v6 - 5, building_y2 - 5)
add_wall(v5 + 5, building_y2 - 5, v6 - 5, building_y2 - 5)
add_edge(r50, j_b5)
add_door(950, h7 + 3)

r51 = add_node(1130, 830, "room", "Security Office")
add_room(r51, "Security Office", v6 + 5, h7 + 5, v7 - 5, building_y2 - 5)
add_wall(v6 + 5, building_y2 - 5, v7 - 5, building_y2 - 5)
add_edge(r51, j_b6)
add_door(1130, h7 + 3)

r52 = add_node(1310, 830, "room", "Print Shop")
add_room(r52, "Print Shop", v7 + 5, h7 + 5, v8 - 5, building_y2 - 5)
add_wall(v7 + 5, building_y2 - 5, v8 - 5, building_y2 - 5)
add_edge(r52, j_b7)
add_door(1310, h7 + 3)

r53 = add_node(1480, 830, "room", "Restroom 2")
add_room(r53, "Restroom 2", v8 + 5, h7 + 5, building_x2 - 5, building_y2 - 5)
add_wall(v8 + 5, building_y2 - 5, building_x2 - 5, building_y2 - 5)
add_wall(building_x2 - 5, h7 + 5, building_x2 - 5, building_y2 - 5)
add_edge(r53, j_b8)
add_door(v8 + 3, 830)

# Entrances already defined as j_left, j_right, j_top, j_bottom in junction grid
add_door(building_x1 - 3, h4)  # West entrance door
add_door(building_x2 + 3, h4)  # East entrance door
add_door(v4, building_y1 - 3)  # North entrance door
add_door(v4, building_y2 + 3)  # South entrance door

# Output the data structure

# Generate corridor rectangles for visual rendering
CORRIDOR_WIDTH = 50
corridors = []

# Horizontal corridors (full width at each h level)
for h in [h1, h2, h3, h4, h5, h6, h7]:
    corridors.append({
        "x": building_x1,
        "y": h - CORRIDOR_WIDTH // 2,
        "width": building_x2 - building_x1,
        "height": CORRIDOR_WIDTH
    })

# Vertical corridors (full height at each v level)
for v in [v1, v2, v3, v4, v5, v6, v7, v8]:
    corridors.append({
        "x": v - CORRIDOR_WIDTH // 2,
        "y": building_y1,
        "width": CORRIDOR_WIDTH,
        "height": building_y2 - building_y1
    })

output = {
    "canvas": {
        "width": WIDTH,
        "height": HEIGHT
    },
    "nodes": nodes,
    "edges": edges,
    "rooms": rooms,
    "walls": walls,
    "doors": doors,
    "corridors": corridors
}

# Save to JSON file
with open("university_navigation_graph.json", "w") as f:
    json.dump(output, f, indent=2)

# Also save to JS file for frontend with correct structure
frontend_output = {
    "rooms": rooms,
    "walls": walls,
    "doors": doors,
    "corridors": corridors,
    "graph": {
        "nodes": nodes,
        "edges": edges
    }
}
js_content = f"export const complexGraph = {json.dumps(frontend_output, indent=4)};"
with open("Frontend/src/data/complexGraph.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Generated navigation graph with:")
print(f"- {len(nodes)} nodes")
print(f"- {len(edges)} edges")
print(f"- {len(rooms)} rooms")
print(f"- {len(walls)} wall segments")
print(f"- {len(doors)} doors")
print(f"\nData saved to university_navigation_graph.json")
print(f"Frontend data saved to Frontend/src/data/complexGraph.js")