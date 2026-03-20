# ContrAI - AI-Powered Polkadot Reputation System

<div align="center">

![ContrAI Banner](https://img.shields.io/badge/ContrAI-Reputation%20Intelligence-FF2867?style=for-the-badge)

**Build transparent reputation systems for the Polkadot ecosystem**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Polkadot](https://img.shields.io/badge/Polkadot-E6007A?style=flat&logo=polkadot&logoColor=white)](https://polkadot.network/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white)](https://soliditylang.org/)

</div>

---

## 🌟 Overview

**ContrAI** (formerly DotRepute) is an AI-powered intelligence layer that transforms raw on-chain signals—identity, governance, and staking—into actionable reputation insights for the Polkadot ecosystem. We analyze blockchain data directly from Polkadot pallets to build comprehensive identity profiles and mint soulbound reputation badges.

### Key Features

- 🤖 **AI-Powered Analysis**: Gemini AI integration for natural language insights
- 🔗 **Direct RPC Integration**: Query Polkadot relay chain directly without intermediaries
- 🏆 **Tier-Based Reputation**: Bronze, Silver, Gold, Platinum, Diamond badges
- 🎫 **Soulbound NFTs**: ERC-5192 compliant non-transferable reputation badges
- 📊 **Multi-Dimensional Scoring**: Governance, Economic, Identity, and Social metrics
- 📄 **Exportable Reports**: Generate PDF/Docx certificates for DAO applications

---

## 🏗️ Architecture

```
ContrAI/
├── frontend/          # Next.js + React + TailwindCSS
├── backend/           # Express.js API + AI Service
├── contracts/         # Solidity Smart Contracts (Hardhat)
└── README.md
```

### Tech Stack

**Frontend**

- Next.js 16 + React 18
- TailwindCSS + Framer Motion
- Wagmi + Viem (Web3 integration)
- Polkadot.js API

**Backend**

- Node.js + Express + TypeScript
- Google Gemini AI (Generative AI)
- Polkadot.js API
- Subscan API integration
- Swagger API documentation

**Smart Contracts**

- Solidity ^0.8.20
- Hardhat development environment
- ERC-721 + ERC-5192 (Soulbound NFT)
- Multi-tier reputation system

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Polkadot wallet (for testing)
- API Keys:
    - Google Gemini API key
    - Subscan API key (optional)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/ContrAI.git
cd ContrAI
```

**2. Setup Backend**

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your API keys:
# GEMINI_API_KEY=your_gemini_api_key
# SUBSCAN_API_KEY=your_subscan_api_key
```

**3. Setup Frontend**

```bash
cd ../frontend
npm install

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8080
```

**4. Setup Smart Contracts (Optional)**

```bash
cd ../contracts
npm install

# Create .env file
cp .env .env
# Add your private key and RPC URL if deploying
```

### Running the Application

**Development Mode:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production Mode:**

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

Access the application at `http://localhost:3000`

API documentation available at `http://localhost:8080/api-docs`

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
PORT=8080
NODE_ENV=development

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Blockchain Data
SUBSCAN_API_KEY=your_subscan_api_key

# Polkadot RPC
POLKADOT_RPC=wss://rpc.polkadot.io

# CORS
CORS_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 📊 Reputation System

### Tier Structure

| Tier            | Percentile Range  | Description         |
| --------------- | ----------------- | ------------------- |
| 💎 **Diamond**  | ≥ 95th percentile | Top 5% of ecosystem |
| 💿 **Platinum** | 85th - 95th       | Elite contributors  |
| 🥇 **Gold**     | 75th - 85th       | Strong reputation   |
| 🥈 **Silver**   | 50th - 75th       | Active participants |
| 🥉 **Bronze**   | < 50th            | Emerging members    |

### Scoring Dimensions

1. **Governance** - Voting participation, proposal activity
2. **Economic** - Staking behavior, transaction patterns
3. **Identity** - On-chain identity verification
4. **Social** - Network effects, validator nominations

---

## 📡 API Endpoints

### Reputation API

```
GET  /api/reputation/:address          # Get reputation score
POST /api/reputation/analyze           # Analyze wallet
GET  /api/reputation/leaderboard       # Top ranked addresses
```

### Chat API

```
POST /api/chat                         # AI-powered chat interface
```

### Health Check

```
GET  /health                           # Service health status
GET  /                                 # Backend status
```

Full API documentation: `http://localhost:8080/api-docs`

---

## 🔐 Smart Contracts

### Core Contracts

1. **ReputationRegistry** - Main entry point, access control
2. **ReputationStorage** - On-chain score storage and history
3. **ReputationBadge** - Soulbound NFT (ERC-5192)
4. **ReputationGate** - Utility for protocol integration

### Deployment

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network <network-name>
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🔗 Links

- **GitHub**: [github.com/2uang2uang/ContrAI](https://github.com/2uang2uang/ContrAI)

---


## 🙏 Acknowledgments

- Polkadot & Web3 Foundation
- Google Gemini AI
- Subscan API
- OpenZeppelin Contracts

---

<div align="center">

**[⬆ Back to Top](#contrai---ai-powered-polkadot-reputation-system)**

</div>
