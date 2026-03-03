1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ContrAI.git
cd ContrAI
```

2. **Setup Backend**

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your API keys:
# GEMINI_API_KEY=your_gemini_api_key
# SUBSCAN_API_KEY=your_subscan_api_key
```

3. **Setup Frontend**

```bash
cd ../frontend
npm install

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8080
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
