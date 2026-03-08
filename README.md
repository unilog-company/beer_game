# Unilog Supply Chain Challenge

A multiplayer simulation of the classic **Beer Game**, reimagined with Unilog's 4PL supply chain theme. Experience the Bullwhip Effect in real-time with up to 4 players.

## Quick Start

```bash
npm install
npm run dev
```

This starts both the game server (port 3001) and the web client (port 5173).

Open **http://localhost:5173** to play.

## How to Play

1. **Create a Game** — Enter your name and create a room
2. **Share the Code** — Give the 4-character room code to other players
3. **Pick Roles** — Each player selects one of the 4 supply chain roles
4. **Fill with AI** — Missing slots can be filled with AI players
5. **Play** — Each week, decide how many units to order from your upstream supplier
6. **Results** — After all weeks complete, see the Bullwhip Effect analysis

## Supply Chain Roles

| Role | Description |
|------|-------------|
| **Retailer** | Fulfills end-consumer demand |
| **3PL Warehouse** | Fulfills the Retailer's orders |
| **Regional Distributor** | Fulfills the 3PL's orders |
| **Manufacturer** | Fulfills the Distributor's orders, initiates production |

## Game Mechanics

- **Holding Cost:** $0.50 per unit of inventory per week
- **Backlog Cost:** $1.00 per unit of backlog per week
- **Shipping Delay:** 2 weeks for freight between nodes
- **Order Delay:** 2 weeks for order requests between nodes
- **Production Delay:** 2 weeks for manufacturing

## 4PL Mode

Toggle **Unilog 4PL Mode** in game settings to enable full supply chain visibility — simulating a real-world control tower that eliminates the information asymmetry causing the Bullwhip Effect.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Framer Motion + Recharts
- **Backend:** Node.js + Express + Socket.IO
- **State:** Zustand (client), in-memory (server)
