# DotRepute Frontend

Frontend Next.js cho hệ thống Polkadot Reputation System.

## Cài đặt

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

## Chạy Development Server

```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## Build Production

```bash
npm run build
npm run start
```

## Cấu trúc thư mục

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── services/              # API services
├── types/                 # TypeScript types
├── public/                # Static files
└── package.json
```

## Công nghệ sử dụng

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React Icons
