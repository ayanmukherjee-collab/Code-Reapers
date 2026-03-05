# 🗺️ Campus Connect

**Offline + AR Indoor Navigation for Universities**
*Hackathon Edition · Lightweight · Fast · Modular*

---

## 🚀 Overview

Campus Compass is an **offline-first indoor navigation system** designed specifically for university campuses.

It enables students, faculty, and visitors to **find any room, office, or facility** instantly — even **without internet access**.

Built in **48 hours** for a hackathon, the system is **modular, scalable, and judge‑friendly**.

---

## ✨ Key Highlights

* 🧭 **Offline indoor navigation** using graph-based pathfinding (A*)
* 📱 **AR navigation mode** (prototype) with camera-based arrow overlays
* 🔍 **Universal campus search** (rooms, faculty, clubs, facilities)
* 🤖 **AI-powered assistant** for natural language campus queries
* 📦 **Building Pack system** for easy expansion

---

## 🧩 Features

### 🏛️ 1. Indoor Navigation

* **Offline Mode**

  * Custom graph-based routing engine
  * Works without internet
  * Text + map-based directions

* **Online / AR Mode (Prototype)**

  * AR arrow overlays using device camera
  * Designed for Expo + ARCore

---

### 📦 2. Building Packs (Modular Design)

Each building is a **self-contained JSON pack** that can be added without modifying app code.

Each pack contains:

* Floor plans (SVG / image reference)
* Landmarks (rooms, offices, stairs, lifts)
* Graph nodes & edges
* Personnel directory (optional)

This makes Campus Compass **scalable across entire campuses**.

---

### 🔍 3. Universal Search

Search across the entire campus for:

* 🏫 Buildings & floors
* 🚪 Rooms & offices
* 👨‍🏫 Faculty members
* 🧑‍🤝‍🧑 Clubs & departments
* 🚻 Washrooms, labs, cafés, etc.

Results are instantly linked to navigation.

---

### 🤖 4. AI Assistant

Ask natural questions like:

* “Where is the Dean’s office?”
* “Who teaches Physics 101?”
* “Which building is the CSE department in?”

The AI responds using:

* Building packs
* University directory data
* Navigation engine

Fast, lightweight, and hackathon-safe.

---

## 🏗️ Tech Stack

### 🎨 Frontend

* React Native (Expo)
* Expo Router
* Reanimated + Gesture Handler

### 🔧 Backend (Hackathon-Friendly)

* Firebase Firestore (offline sync enabled)
* Firebase Storage (building pack JSONs)

### 🧭 Mapping & Navigation

* Custom SVG / JSON floor plans
* Graph-based pathfinding (A* algorithm)

### 📱 AR (Prototype)

* Expo AR module (ARCore-based)
* Basic directional arrow overlays

### 🤖 AI

* Local JSON-based Q&A (fast, offline-capable)
* Rule-based + document lookup system
* Optional external API (if allowed)

---

## 📁 Project Structure

```
campus-compass/
│── app/                     # React Native app
│   ├── components/
│   ├── screens/
│   ├── utils/
│   └── navigation/
│
│── src/
│   ├── ai/
│   │   └── queryEngine.js   # faculty search, directory Q&A
│   ├── mapping/
│   │   ├── parser.js        # floor plan → graph converter
│   │   ├── pathfinding.js   # A* algorithm
│   │   └── buildingLoader.js
│   ├── backend/
│   │   └── firebase.js
│   └── data/
│       └── sampleBuildingPack.json
│
│── assets/
│── README.md
│── package.json
│── .gitignore
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone <repo-url>
cd campus-compass
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the App

```bash
npx expo start
```

Runs on Android, iOS (simulator), or Expo Go.

---

## 🎒 How to Add a New Building

### Step 1 — Upload Floor Plan

Upload SVG or image-based floor plans.

### Step 2 — Run Floor Plan Parser

The parser extracts:

* Landmarks
* Navigation nodes
* Edges & directions

### Step 3 — Generate Building Pack JSON

```json
{
  "buildingId": "block-A",
  "floors": [
    {
      "level": 1,
      "landmarks": [],
      "edges": []
    }
  ]
}
```

### Step 4 — Upload to Firebase

Once uploaded, the app fetches it automatically.

No app rebuild required.

---

## 🛣️ Navigation Flow

1. User selects destination
2. App loads relevant building pack
3. A* algorithm computes shortest path
4. Offline → map + text directions
5. Online → AR arrows (prototype)

---

## 🧠 AI Search Flow

1. User asks a question
2. Faculty / directory search
3. Landmark identified
4. Directions displayed
5. Optional navigation start

---

## 👥 Team Roles (Recommended)

* 🎨 **Frontend** – UI, screens, navigation flows
* 🔧 **Backend** – Firebase, building packs, directory data
* 🤖 **AI** – Parser, search engine, Q&A logic

---

## 🎯 Hackathon Pitch

> *“Campus Compass is an offline-first indoor navigation system with both AR and graph-based routing.
> Users can search any room, faculty, or facility and instantly get directions.
> Buildings are added using simple JSON packs, making the system scalable across entire universities.”*

---

## 🏁 Project Status

* 🚧 Active hackathon project
* ✨ Core navigation & search functional
* 🛣️ AR minimal prototype (demo-ready)

---

## 📜 License

MIT License

---

**Built for speed. Designed for scale. Ready for demo.** 😎
