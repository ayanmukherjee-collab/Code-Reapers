"""
Campus AI Chatbot Module

Provides intent detection, entity extraction, and response generation
for the campus navigation chatbot. Uses keyword matching and fuzzy search
to understand user queries about faculty and room locations.
"""

import re
from typing import Dict, List, Optional, Any
from difflib import SequenceMatcher

# ============================================================================
# CAMPUS DATA (embedded for hackathon demo - in production, load from DB)
# ============================================================================

FACULTY_DATA = [
    {"id": 1, "name": "Dr. Emily Carter", "subject": "Data Structures", "room": "Faculty Office 1", "roomId": "node_68", "office": "Block A", "available": True},
    {"id": 2, "name": "Prof. James Lee", "subject": "Machine Learning", "room": "Faculty Office 2", "roomId": "node_76", "office": "Block B", "available": False},
    {"id": 3, "name": "Dr. Maria Garcia", "subject": "Software Engineering", "room": "Dean's Office", "roomId": "node_81", "office": "Block A", "available": True},
    {"id": 4, "name": "Dr. Sarah Wilson", "subject": "Computer Networks", "room": "Admin Office 1", "roomId": "node_82", "office": "Block C", "available": True},
    {"id": 5, "name": "Prof. Robert Chen", "subject": "Database Systems", "room": "Computer Lab 1", "roomId": "node_61", "office": "Block A", "available": False},
]

ROOMS_DATA = [
    {"id": "node_60", "name": "Room 101"},
    {"id": "node_61", "name": "Computer Lab 1"},
    {"id": "node_62", "name": "Room 103"},
    {"id": "node_63", "name": "Lecture Hall A"},
    {"id": "node_64", "name": "Physics Lab"},
    {"id": "node_65", "name": "Room 106"},
    {"id": "node_66", "name": "Library"},
    {"id": "node_67", "name": "Room 108"},
    {"id": "node_68", "name": "Faculty Office 1"},
    {"id": "node_69", "name": "Room 110"},
    {"id": "node_70", "name": "Classroom 1"},
    {"id": "node_71", "name": "Classroom 2"},
    {"id": "node_72", "name": "Study Room 1"},
    {"id": "node_73", "name": "Reading Room"},
    {"id": "node_74", "name": "Archives"},
    {"id": "node_75", "name": "Storage"},
    {"id": "node_76", "name": "Faculty Office 2"},
    {"id": "node_77", "name": "Computer Lab 2"},
    {"id": "node_78", "name": "Lecture Hall B"},
    {"id": "node_79", "name": "Chemistry Lab"},
    {"id": "node_80", "name": "Lab Prep Room"},
    {"id": "node_81", "name": "Dean's Office"},
    {"id": "node_82", "name": "Admin Office 1"},
    {"id": "node_83", "name": "Cafeteria"},
    {"id": "node_84", "name": "Kitchen"},
    {"id": "node_85", "name": "Dining Hall"},
    {"id": "node_86", "name": "Reception Lobby"},
    {"id": "node_87", "name": "Conference Room"},
    {"id": "node_88", "name": "Meeting Room"},
    {"id": "node_89", "name": "Admin Office 2"},
    {"id": "node_90", "name": "HR Office"},
    {"id": "node_91", "name": "Student Lounge"},
    {"id": "node_92", "name": "Game Room"},
    {"id": "node_93", "name": "Study Room 2"},
    {"id": "node_94", "name": "Lecture Hall C"},
    {"id": "node_95", "name": "Biology Lab"},
    {"id": "node_96", "name": "Anatomy Room"},
    {"id": "node_97", "name": "Medical Lab"},
    {"id": "node_98", "name": "Pharmacy Lab"},
    {"id": "node_99", "name": "Gymnasium"},
    {"id": "node_100", "name": "Sports Equipment"},
    {"id": "node_101", "name": "Music Room"},
    {"id": "node_102", "name": "Art Studio"},
    {"id": "node_103", "name": "Drama Theater"},
    {"id": "node_104", "name": "Media Lab"},
    {"id": "node_105", "name": "Broadcasting Studio"},
    {"id": "node_106", "name": "Restroom 1"},
    {"id": "node_107", "name": "Maintenance"},
    {"id": "node_108", "name": "Janitor's Closet"},
    {"id": "node_109", "name": "Server Room"},
    {"id": "node_110", "name": "IT Support"},
    {"id": "node_111", "name": "Security Office"},
    {"id": "node_112", "name": "Print Shop"},
    {"id": "node_113", "name": "Restroom 2"},
]

# ============================================================================
# INTENT DETECTION
# ============================================================================

INTENT_PATTERNS = {
    "navigate": [
        r"\b(go|take|navigate|directions?|way|route|path|walk|get)\s*(me\s*)?(to)?\b",
        r"\bhow\s+(do\s+i\s+)?(get|go|reach|find)\b",
        r"\bwhere\s+is\b",
        r"\bfind\s+(the\s+)?(way|path|route)\b",
        r"\btake\s+me\b",
    ],
    "faculty": [
        r"\b(dr\.?|prof\.?|professor|doctor)\s+\w+",
        r"\b(faculty|professor|teacher|instructor)\b",
        r"\bwho\s+teaches\b",
        r"\b\w+['']s?\s+office\b",
    ],
    "room_info": [
        r"\b(room|lab|hall|office|library|cafeteria|lounge|gym|studio)\s*\d*\b",
        r"\bwhere\s+is\s+(the\s+)?\w+\b",
    ],
    "greeting": [
        r"\b(hi|hello|hey|howdy|greetings|good\s+(morning|afternoon|evening))\b",
    ],
    "help": [
        r"\b(help|assist|what\s+can\s+you|how\s+do\s+i)\b",
    ],
}


def detect_intent(message: str) -> str:
    """Detect the user's intent from their message."""
    message_lower = message.lower().strip()
    
    # Check patterns in priority order
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                # Faculty check takes precedence if faculty name detected
                if intent == "navigate":
                    # Check if it's about a faculty member
                    for faculty in FACULTY_DATA:
                        if fuzzy_match(message_lower, faculty["name"].lower()) > 0.6:
                            return "faculty"
                return intent
    
    return "general"


# ============================================================================
# ENTITY EXTRACTION
# ============================================================================

def fuzzy_match(query: str, target: str) -> float:
    """Calculate fuzzy match score between query and target."""
    query = query.lower()
    target = target.lower()
    
    # Direct substring match
    if query in target or target in query:
        return 0.9
    
    # Sequence matching
    return SequenceMatcher(None, query, target).ratio()


def extract_faculty(message: str) -> Optional[Dict]:
    """Extract faculty member from message using fuzzy matching."""
    message_lower = message.lower()
    
    best_match = None
    best_score = 0.0
    
    for faculty in FACULTY_DATA:
        # Check full name
        score = fuzzy_match(message_lower, faculty["name"].lower())
        
        # Also check last name only
        last_name = faculty["name"].split()[-1].lower()
        if last_name in message_lower:
            score = max(score, 0.85)
        
        # Check subject
        if faculty["subject"].lower() in message_lower:
            score = max(score, 0.7)
        
        if score > best_score and score > 0.5:
            best_score = score
            best_match = faculty
    
    return best_match


def extract_room(message: str) -> Optional[Dict]:
    """Extract room from message using fuzzy matching."""
    message_lower = message.lower()
    
    best_match = None
    best_score = 0.0
    
    for room in ROOMS_DATA:
        score = fuzzy_match(message_lower, room["name"].lower())
        
        # Check for room number patterns
        room_name_lower = room["name"].lower()
        if room_name_lower in message_lower:
            score = 0.95
        
        if score > best_score and score > 0.4:
            best_score = score
            best_match = room
    
    return best_match


# ============================================================================
# RESPONSE GENERATION
# ============================================================================

def generate_response(intent: str, message: str) -> Dict[str, Any]:
    """Generate chatbot response based on intent and extracted entities."""
    
    response = {
        "response": "",
        "actions": []
    }
    
    if intent == "greeting":
        response["response"] = "Hello! I'm your Campus AI assistant. I can help you find rooms, faculty offices, and navigate around campus. What are you looking for?"
        return response
    
    if intent == "help":
        response["response"] = "I can help you with:\n• Finding faculty offices (e.g., 'Where is Dr. Carter?')\n• Navigating to rooms (e.g., 'Take me to the Library')\n• Getting room information (e.g., 'Where is Room 101?')\n\nJust ask me anything!"
        return response
    
    if intent == "faculty":
        faculty = extract_faculty(message)
        if faculty:
            status = "available now ✓" if faculty["available"] else "currently busy"
            response["response"] = f"{faculty['name']} teaches {faculty['subject']} and is located in {faculty['room']} ({faculty['office']}). They are {status}."
            response["actions"].append({
                "type": "navigate",
                "label": f"Navigate to {faculty['room']}",
                "roomId": faculty["roomId"],
                "roomName": faculty["room"]
            })
        else:
            response["response"] = "I couldn't find that faculty member. Try asking about Dr. Emily Carter, Prof. James Lee, Dr. Maria Garcia, Dr. Sarah Wilson, or Prof. Robert Chen."
        return response
    
    if intent in ["navigate", "room_info"]:
        room = extract_room(message)
        if room:
            response["response"] = f"I found {room['name']}! Click below to get directions."
            response["actions"].append({
                "type": "navigate",
                "label": f"Navigate to {room['name']}",
                "roomId": room["id"],
                "roomName": room["name"]
            })
        else:
            # Try faculty match as fallback
            faculty = extract_faculty(message)
            if faculty:
                response["response"] = f"Looking for {faculty['name']}? They're in {faculty['room']}."
                response["actions"].append({
                    "type": "navigate",
                    "label": f"Navigate to {faculty['room']}",
                    "roomId": faculty["roomId"],
                    "roomName": faculty["room"]
                })
            else:
                response["response"] = "I couldn't find that location. Try asking about specific rooms like 'Library', 'Cafeteria', 'Computer Lab 1', or faculty like 'Dr. Carter'."
        return response
    
    # General/fallback response
    response["response"] = "I'm not sure I understood that. You can ask me:\n• 'Where is the Library?'\n• 'Take me to Dr. Carter's office'\n• 'How do I get to Room 101?'"
    return response


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def process_message(message: str) -> Dict[str, Any]:
    """
    Main entry point for processing chat messages.
    
    Args:
        message: User's chat message
        
    Returns:
        Dict with 'response' (str) and 'actions' (list of action objects)
    """
    if not message or not message.strip():
        return {
            "response": "Please type a message. I can help you find rooms and faculty!",
            "actions": []
        }
    
    intent = detect_intent(message)
    return generate_response(intent, message)


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    test_messages = [
        "Hello",
        "Where is Dr. Carter?",
        "Take me to the library",
        "How do I get to Room 101?",
        "Who teaches Machine Learning?",
        "Navigate to the cafeteria",
        "Help",
    ]
    
    print("=" * 60)
    print("CHATBOT TEST")
    print("=" * 60)
    
    for msg in test_messages:
        print(f"\n> User: {msg}")
        result = process_message(msg)
        print(f"< Bot: {result['response']}")
        if result['actions']:
            for action in result['actions']:
                print(f"  [Action: {action['label']} → {action['roomId']}]")
