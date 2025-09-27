# 🌊 BGAPP Data Flow Architecture

## Real-time Oceanographic Data Pipeline

```mermaid
graph TB
    %% External Data Sources
    COP[Copernicus Marine Service<br/>🌡️ Temperature, Chlorophyll, Salinity]
    GFW[Global Fishing Watch<br/>🛥️ Vessel Tracking Data]
    EOX[EOX STAC API<br/>🛰️ Satellite Data Catalog]
    GEBCO[GEBCO<br/>🗺️ Bathymetry Data]

    %% Cloudflare Workers Layer
    subgraph "Cloudflare Workers - Edge Computing"
        CW[Copernicus Worker<br/>Data Ingestion & Processing]
        GW[GFW Proxy Worker<br/>Vessel Data Transformation]
        SW[STAC Worker<br/>Catalog Management]
        AW[API Worker<br/>Main REST API]
    end

    %% Data Storage Layer
    subgraph "Data Storage - Cloudflare"
        KV[(KV Cache<br/>⚡ 24h TTL<br/>Oceanographic Data)]
        D1[(D1 Database<br/>💾 SQLite<br/>Vessels & Config)]
    end

    %% Frontend Applications
    subgraph "Frontend Applications"
        FE[Static Frontend<br/>🎯 Public Scientific Interface<br/>deck.gl + Three.js]
        AD[Admin Dashboard<br/>💼 Next.js 14<br/>Radix UI + Tailwind]
        RA[Realtime Angola<br/>🌊 Next.js 14 + ML<br/>TensorFlow.js + deck.gl]
    end

    %% Data Flow Connections
    COP -->|REST API/WMS<br/>Every 30min| CW
    GFW -->|REST API<br/>Every 15min| GW
    EOX -->|STAC API<br/>On demand| SW
    GEBCO -->|WMS<br/>Cached 7d| AW

    CW -->|Cache processed data<br/>JSON format| KV
    GW -->|Store vessel tracks<br/>Spatial queries| D1
    SW -->|Catalog metadata<br/>Discovery index| D1
    AW -->|Read cached data| KV
    AW -->|Query vessel data| D1

    %% Frontend Data Consumption
    FE -->|GET /api/oceanographic<br/>Scientific visualizations| AW
    FE -->|GET /api/bathymetry<br/>3D terrain rendering| AW

    AD -->|GET /api/admin/*<br/>CRUD operations| AW
    AD -->|GET /api/vessels<br/>Management interface| AW

    RA -->|WebSocket /api/realtime<br/>Live updates| AW
    RA -->|GET /api/gfw/*<br/>Vessel tracking| GW
    RA -->|GET /api/copernicus/*<br/>Ocean conditions| CW

    %% Performance Optimization
    KV -.->|Cache hit<br/>< 100ms| FE
    KV -.->|Cache hit<br/>< 100ms| RA
    D1 -.->|Spatial index<br/>< 200ms| RA

    %% Styling
    classDef external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef worker fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef storage fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef frontend fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class COP,GFW,EOX,GEBCO external
    class CW,GW,SW,AW worker
    class KV,D1 storage
    class FE,AD,RA frontend
```

## Authentication & Security Flow

```mermaid
sequenceDiagram
    participant U as User/Government
    participant AD as Admin Dashboard
    participant AW as API Worker
    participant D1 as D1 Database
    participant KV as KV Cache

    Note over U,KV: Authentication Flow
    U->>AD: Login Request
    AD->>AD: Validate credentials
    AD->>AW: POST /api/auth/login
    AW->>D1: Query user permissions
    D1-->>AW: User role & permissions
    AW->>KV: Cache session token
    AW-->>AD: JWT token + permissions
    AD-->>U: Dashboard access granted

    Note over U,KV: Authorized Data Access
    U->>AD: Request vessel data
    AD->>AW: GET /api/vessels (with JWT)
    AW->>KV: Validate session
    KV-->>AW: Session valid
    AW->>D1: Query vessels with permissions
    D1-->>AW: Filtered vessel data
    AW-->>AD: Authorized data response
    AD-->>U: Display filtered data
```

## Real-time Data Synchronization

```mermaid
graph LR
    subgraph "Data Sources"
        CP[Copernicus API<br/>Every 30 min]
        GF[GFW API<br/>Every 15 min]
    end

    subgraph "Processing Pipeline"
        CW[Copernicus Worker<br/>🔄 Transform & Validate]
        GW[GFW Worker<br/>🔄 Enrich & Filter]
    end

    subgraph "Storage & Cache"
        KV[(KV Store<br/>⚡ Fast Access)]
        D1[(D1 Database<br/>📊 Persistent)]
    end

    subgraph "Real-time Updates"
        WS[WebSocket<br/>📡 Live Updates]
        SSE[Server-Sent Events<br/>📊 Data Streams]
    end

    subgraph "Client Applications"
        RA[Realtime Angola<br/>🌊 Live Monitoring]
        AD[Admin Dashboard<br/>💼 Management]
    end

    CP -->|HTTP Scheduled| CW
    GF -->|HTTP Scheduled| GW

    CW -->|Cache oceanographic| KV
    CW -->|Log processing| D1
    GW -->|Cache vessel data| KV
    GW -->|Store vessel tracks| D1

    KV -->|Real-time data| WS
    D1 -->|Historical data| SSE

    WS -->|Live ocean data| RA
    SSE -->|Data updates| AD
    SSE -->|Vessel tracking| RA

    %% Update frequency annotations
    CP -.->|"🕐 Every 30min<br/>Ocean conditions"| CW
    GF -.->|"🕐 Every 15min<br/>Vessel positions"| GW
    WS -.->|"⚡ < 1s latency<br/>Critical updates"| RA
```

## Machine Learning Data Pipeline

```mermaid
graph TB
    subgraph "Data Sources"
        VD[Vessel Data<br/>📍 Positions, Speed, Course]
        OD[Ocean Data<br/>🌡️ Temp, Chlorophyll, Salinity]
        BD[Bathymetry<br/>🗺️ Depth, Terrain]
    end

    subgraph "Data Processing"
        DP[Data Preprocessor<br/>🔧 Clean & Normalize]
        FE[Feature Engineering<br/>⚙️ Spatial & Temporal Features]
        DS[Data Sampler<br/>🎯 Training/Validation Split]
    end

    subgraph "ML Pipeline"
        VC[Vessel Classifier<br/>🤖 TensorFlow.js<br/>Fishing vs Transport]
        AD[Anomaly Detector<br/>🚨 Unusual Patterns]
        PP[Prediction Pipeline<br/>📈 Ocean Forecasting]
    end

    subgraph "Real-time Inference"
        RT[Realtime Angola App<br/>🌊 Browser-based ML]
        VI[Vessel Intelligence<br/>🛥️ Live Classification]
        AP[Anomaly Prediction<br/>⚠️ Alert System]
    end

    subgraph "Results & Actions"
        AL[Alert System<br/>🚨 Government Notifications]
        DV[Data Visualization<br/>📊 Interactive Maps]
        RP[Reports<br/>📋 Scientific Analysis]
    end

    VD --> DP
    OD --> DP
    BD --> DP

    DP --> FE
    FE --> DS

    DS --> VC
    DS --> AD
    DS --> PP

    VC -->|Trained Models<br/>TFJS Format| RT
    AD -->|Anomaly Models<br/>TFJS Format| RT
    PP -->|Prediction Models<br/>TFJS Format| RT

    RT --> VI
    RT --> AP
    VI --> DV
    AP --> AL

    DV --> RP
    AL --> RP

    %% Performance annotations
    RT -.->|"⚡ Client-side inference<br/>< 100ms response"| VI
    AP -.->|"🚨 Real-time alerts<br/>< 5s detection"| AL
```

## Deployment & CDN Architecture

```mermaid
graph TB
    subgraph "Global CDN - Cloudflare"
        CF[Cloudflare Edge<br/>🌐 Global Distribution]
    end

    subgraph "Static Assets - Pages"
        FE[Frontend App<br/>🎯 Static HTML/CSS/JS]
        AD[Admin Dashboard<br/>💼 Next.js Build]
        RA[Realtime Angola<br/>🌊 Next.js Build]
    end

    subgraph "Serverless APIs - Workers"
        AW[API Worker<br/>⚡ Edge Computing]
        GW[GFW Proxy<br/>🛥️ Vessel Data]
        CW[Copernicus Worker<br/>🌡️ Ocean Data]
        SW[STAC Worker<br/>🛰️ Catalog API]
    end

    subgraph "Data Layer"
        D1[(D1 Database<br/>📊 SQLite Edge)]
        KV[(KV Store<br/>⚡ Global Cache)]
    end

    subgraph "External APIs"
        EXT[External Services<br/>🌐 Copernicus, GFW, EOX]
    end

    CF --> FE
    CF --> AD
    CF --> RA
    CF --> AW
    CF --> GW
    CF --> CW
    CF --> SW

    AW --> D1
    GW --> D1
    CW --> KV
    SW --> D1

    AW --> KV
    GW --> KV

    CW --> EXT
    GW --> EXT
    SW --> EXT

    %% Performance annotations
    CF -.->|"⚡ < 50ms<br/>Global edge delivery"| FE
    AW -.->|"⚡ < 100ms<br/>Serverless response"| CF
    KV -.->|"⚡ < 10ms<br/>Edge cache access"| AW
    D1 -.->|"⚡ < 50ms<br/>SQLite queries"| AW
```

## 🎯 December 2025 Performance Targets

| Component | Target Performance | Current Status |
|-----------|-------------------|----------------|
| **Frontend Load Time** | < 2.0s | 1.8s ✅ |
| **Admin Dashboard** | < 2.0s | 2.3s 🔄 |
| **Realtime Angola** | < 2.0s | 2.1s 🔄 |
| **API Response Time** | < 100ms | 95ms ✅ |
| **WebSocket Latency** | < 50ms | 45ms ✅ |
| **Map Interaction** | < 100ms | 85ms ✅ |
| **ML Inference** | < 200ms | 150ms ✅ |
| **Data Freshness** | < 30min | 15min ✅ |