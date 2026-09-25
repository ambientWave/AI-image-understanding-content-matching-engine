# Image Understanding & Content Matching Engine

> **Enterprise-Grade Asynchronous Multimodal AI Processing Pipeline & Semantic Content Matching System**  
> Built with **Express 5**, **TypeScript**, **PostgreSQL 16**, **Redis 7 + BullMQ 6**, **ChromaDB**, **TSyringe**, **Zod**, **Google Gemini 3.1 Flash Lite**, **CLIP**, and **Nomic Embeddings**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D.svg?logo=redis)](https://redis.io/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange.svg)](https://www.trychroma.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Distributed%20Queues-red.svg)](https://bullmq.io/)
[![Zod](https://img.shields.io/badge/Zod-Schema%20Validation-3E67B1.svg?logo=zod)](https://zod.dev/)
[![TSyringe](https://img.shields.io/badge/TSyringe-IoC%20%2F%20DI-brightgreen.svg)](https://github.com/microsoft/tsyringe)
[![Gemini Vision](https://img.shields.io/badge/Google%20GenAI-Gemini%203.1%20Flash%20Lite-4285F4.svg?logo=google)](https://ai.google.dev/)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Screenshots](#screenshots)
- [Core Architectural Principles & Highlights](#core-architectural-principles--highlights)
  - [1. Clean Monolithic Multilayered Architecture & Separation of Concerns](#1-clean-monolithic-multilayered-architecture--separation-of-concerns)
  - [2. Dependency Injection via TSyringe: In-Memory Model & Client Retention](#2-dependency-injection-via-tsyringe-in-memory-model--client-retention)
  - [3. Event-Driven Architecture with Redis & BullMQ: Production-Ready Scaling](#3-event-driven-architecture-with-redis--bullmq-production-ready-scaling)
  - [4. Tiered Hybrid AI Model Strategy: Cost-Effectiveness via Quantized Local Models](#4-tiered-hybrid-ai-model-strategy-cost-effectiveness-via-quantized-local-models)
  - [5. Strict Runtime Schema Validation with Zod for Consistent, Deterministic AI Results](#5-strict-runtime-schema-validation-with-zod-for-consistent-deterministic-ai-results)
  - [6. PostgreSQL + ChromaDB Dual-Storage Architecture](#6-postgresql--chromadb-dual-storage-architecture)
  - [7. Deterministic Financial Observability & Micro-Cent Cost Accounting](#7-deterministic-financial-observability--micro-cent-cost-accounting)
- [High-Level Architectural Schematic Diagram](#high-level-architectural-schematic-diagram)
- [End-to-End Request/Response Lifecycle](#end-to-end-requestresponse-lifecycle)
  - [1. Asynchronous Image Ingestion & Multimodal Vectorization](#1-asynchronous-image-ingestion--multimodal-vectorization)
  - [2. Post Summarization, Embedding & Semantic Image Matching](#2-post-summarization-embedding--semantic-image-matching)
- [Layer Responsibilities & Component Directory](#layer-responsibilities--component-directory)
- [System Invariants & Strict Architectural Rules](#system-invariants--strict-architectural-rules)
- [Database Schema & Data Persistence Models](#database-schema--data-persistence-models)
- [API Endpoints Reference & Payload Examples](#api-endpoints-reference--payload-examples)
  - [Image Ingestion & Search Endpoints](#image-ingestion--search-endpoints)
  - [Post Processing & Semantic Matching Endpoints](#post-processing--semantic-matching-endpoints)
  - [Distributed Queue Monitoring Endpoints](#distributed-queue-monitoring-endpoints)
  - [Cost Tracking & Observability Endpoints](#cost-tracking--observability-endpoints)
- [Interactive Frontend Observability Suite](#interactive-frontend-observability-suite)
- [Install & Quick Start](#install--quick-start)
- [Environment Configuration](#environment-configuration)
- [Frequently Asked Questions (FAQ) for AI Crawlers & Developers](#frequently-asked-questions-faq-for-ai-crawlers--developers)
- [References](#references)

---

## Project Overview

The **Image Understanding & Content Matching Engine** is a high-throughput, decoupled distributed backend system engineered to solve two fundamental problems in modern AI content delivery:
1. **Automated Multimodal Image Extraction & Vector Indexing**: Ingesting high-volume image batches, extracting structured semantic annotations (subject, category, attributes, natural language captions, and safety confidence scores) via **Google Gemini 3.1 Flash Lite**, validating the responses with **Zod**, and persisting dual vector representations (**CLIP ViT-B/32** image embeddings and **Nomic Embed Text v1.5** text embeddings) in **ChromaDB**.
2. **Contextual Article-to-Image Matching with Semantic Guardrails**: Ingesting long-form blog and article URLs, generating zero-cost local summaries with quantized **HuggingFace T5-Small**, converting post summaries into high-dimensional embeddings, and executing high-precision vector similarity retrieval against pre-indexed images with configurable similarity thresholds ($\ge 0.80$) to eliminate false-positive image recommendations.
3. **Accurate Token-Based Cost Accounting**: Real-time token counting via Gemini's `usageMetadata` with official per-token pricing ($0.25/1M input, $1.50/1M output), replacing flat-rate estimation.

The system combines **Express 5**, **TypeScript**, **PostgreSQL 16**, **Redis 7 + BullMQ 6**, **TSyringe Dependency Injection**, **Zod**, and a responsive dashboard.

---

## Screenshots
<img width="820" height="952" alt="1" src="https://github.com/user-attachments/assets/5338b545-7667-48c9-9ac2-8ad56b5b7f3b" />
<img width="1869" height="899" alt="2" src="https://github.com/user-attachments/assets/02af7eee-4277-440b-9484-3eb35af41fa3" />
<img width="1878" height="1596" alt="3" src="https://github.com/user-attachments/assets/cc602134-6dbf-476f-8a56-ff1da0a739d8" />
<img width="1894" height="894" alt="4" src="https://github.com/user-attachments/assets/59c69637-a040-4324-847a-498007da042e" />


---

## Core Architectural Principles & Highlights

### 1. Clean Monolithic Multilayered Architecture & Separation of Concerns

This project adheres strictly to a **clean monolithic multilayered architecture**. By establishing clear, well-defined boundaries between layers, the codebase eliminates circular dependencies, isolates failure domains, and guarantees horizontal scalability.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           SEPARATION OF CONCERNS DECISION MATRIX                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 [Presentation Layer]      Routes translate HTTP ──▶ Single Service Call (No lists, no loops, pure transport)
         │
         ▼
 [Orchestration Layer]     Orchestrator decides workflow sequencing ──▶ Produces BullMQ Jobs & triggers callbacks
         │
         ▼
 [Event-Driven Queue]      Redis + BullMQ handles backpressure, retries, concurrency, and worker dispatching
         │
         ▼
 [Worker Consumer Layer]   Workers execute "Run ONE step, then hand control back" ──▶ Delegates to Domain Service
         │
         ▼
 [Domain Service Layer]    Services own ALL business logic: "For each of these, do a thing", validation, AI calls
         │
         ▼
 [Persistence Layer]       Repositories translate One Bulk Operation ──▶ SQL/Vectors (UNNEST, no loops in repos)
         │
         ▼
 [Dual Storage Layer]      PostgreSQL 16 (ACID Operational Master)  +  ChromaDB (Low-latency Vector Space)
```

#### The Fundamental Decision-Making Rule: "Who Is Allowed to Make Decisions?"

To prevent architectural erosion, every layer's responsibility is governed by a strict decision-making rule:

1. **Routes (`src/routes/`) — Pure HTTP Translation**:
   - Routes translate incoming HTTP requests into a single service or orchestrator call, nothing more.
   - Routes **should not know there is a list at all**; they simply receive a request and return a response. They contain zero loops, zero business logic, and zero persistence access.
2. **Service Layer (`src/services/`) — The Exclusive Home of Business Logic**:
   - The service layer is the **only place in the entire system allowed to say "for each of these, do a thing"**.
   - That orchestration decision *is* the core business logic. Services coordinate AI inferences, enforce Zod validation schemas, manage transaction lifecycles, and mediate with repositories.
3. **Repositories (`src/repositories/`) — Bulk Persistence Without Business Logic**:
   - Repositories translate **one bulk operation $\rightarrow$ SQL or Vector queries**.
   - Repositories express "insert these $N$ rows" as a single bulk query (e.g. `INSERT ... SELECT * FROM UNNEST(...)`).
   - **Repositories must never contain a `for` loop calling `insert()` $N$ times** — that is business orchestration wearing a persistence hat.
   - **One Repository Per Aggregate**: Boundaries match domain concepts that services think in (e.g., `ImageDBRepository`, `PostDBRepository`, `CostLogDBRepository`), not merely "a database table exists."
4. **Workers (`src/workers/`) — "Run One Step, Then Hand Control Back"**:
<img width="1919" height="1079" alt="5" src="https://github.com/user-attachments/assets/5cb1dda6-33d9-46b9-9469-8b05e6bf0b5d" />

   - A worker's sole job is to take a job payload from BullMQ, invoke the appropriate Domain Service method, and hand control back to the orchestrator.
   - **Workers never contain a decision about what happens next.** The next step in the pipeline is always determined by the Orchestrator's lifecycle callbacks.
   - **Workers NEVER call Repositories directly.** All data access is strictly encapsulated within Domain Services.

---

### 2. Dependency Injection via TSyringe: In-Memory Model & Client Retention

Heavy AI models and client SDKs require substantial CPU and memory overhead during initialization (allocating buffers, loading tokenizer vocabularies, reading ONNX/FP16 weights, and establishing connection pools). Re-instantiating these classes on every HTTP request or worker execution would destroy throughput and cause severe memory churn.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                TSyringe SINGLETON IN-MEMORY RESIDENCE                                │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

 App Startup (One-Time Boot)
     │
     ├──▶ Pre-loads CLIP ViT-B/32 Weights (FP16 ONNX)       ──▶ Kept in RAM (Singleton)
     ├──▶ Initializes ChromaDB REST Client & Collections    ──▶ Kept in RAM (Singleton)
     ├──▶ Warms Nomic Embed Text & T5-Small Tokenizers      ──▶ Kept in RAM (Singleton)
     └──▶ Connects PostgreSQL Connection Pool & Redis      ──▶ Kept in RAM (Singleton)
     │
     ▼
 Runtime HTTP Requests & BullMQ Worker Executions
     ├──▶ Zero weight-loading latency (< 1ms container resolution)
     ├──▶ Reuses active DB pools and persistent vector store channels
     └──▶ Immutable class instances share state without re-initialization
```

- **TSyringe IoC Container (`src/config/container.ts`)**: Registers all repositories, domain services, and orchestrators as **application singletons** (`Lifecycle.Singleton`).
- **Heavy Model Retention**: Classes such as `ImageEmbedRepository` (which loads `CLIPVisionModelWithProjection` and `AutoProcessor`) and `TextEmbedRepository` (which connects to ChromaDB collections) load their weights **exactly once** during application startup.
- **Instantaneous Resolution**: Workers and routes resolve fully initialized instances via `container.resolve()` in sub-millisecond time without re-incurring weight allocation or tokenizer compilation overhead.

---

### 3. Event-Driven Architecture with Redis & BullMQ: Production-Ready Scaling

Synchronous HTTP request-response processing breaks down under heavy multimodal AI workloads. By adopting an **event-driven architecture** with **Redis 7** and **BullMQ 6**, the system is production-ready for horizontal scaling and high-concurrency throughput:

| Production Scaling Concern | Synchronous Monolith | Event-Driven Redis + BullMQ (This Project) |
| :--- | :--- | :--- |
| **Ingestion Latency** | Client hangs for 30s–120s per batch. | **Immediate `202 Accepted` in < 25ms**; jobs enqueued asynchronously. |
| **Backpressure & Concurrency** | Uncontrolled bursts crash downstream APIs. | **Strict worker concurrency limits** (`concurrency: 5` for Vision, `concurrency: 10` for Embeddings). |
| **Failure Recovery & Blast Radius** | Single failure aborts whole batch. | **Isolated job retries**: 3 automatic attempts with exponential backoff (5s delay); independent queues (`vision`, `embed`, `post-summarize`). |
| **Worker Scaling** | Web processes locked to CPU limits. | **Stateless workers** can be horizontally scaled across multiple Node.js worker processes or container replicas. |
| **Job Deduplication & State** | Volatile in-memory arrays lost on restart. | **PostgreSQL owns state**; BullMQ handles reliable Redis stream delivery with row-level locks (`FOR UPDATE`). |

---

### 4. Tiered Hybrid AI Model Strategy: Cost-Effectiveness via Quantized Local Models

To maximize cost-effectiveness while preserving state-of-the-art multimodal vision capabilities, the engine employs a **two-tier hybrid AI model topology**:

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │               TIERED HYBRID AI TOPOLOGY                 │
                                  └─────────────────────────────────────────────────────────┘
                                                               │
                              ┌────────────────────────────────┴────────────────────────────────┐
                              ▼                                                                 ▼
                ┌───────────────────────────┐                                     ┌───────────────────────────┐
                │   TIER 1: LOCAL QUANTIZED │                                     │   TIER 2: CLOUD MULTIMODAL│
                │     SMALL MODELS ($0)     │                                     │     FOUNDATION LLM        │
                ├───────────────────────────┤                                     ├───────────────────────────┤
                │ • CLIP ViT-B/32 (FP16)    │                                     │ • Google Gemini 3.1 Flash │
                │   Visual dense embeddings │                                     │   Lite (or 2.5 Flash)     │
                │ • Nomic Embed Text v1.5   │                                     │ • Deep semantic reasoning │
                │   Semantic text vectors   │                                     │ • Detailed entity tagging │
                │ • T5-Small Local Pipeline │                                     │ • Complex scene captions  │
                │   Zero-cost summarization │                                     │ • Confidence scoring      │
                │ ➔ Cost: $0.000000 / call │                                     │ ➔ Cost: $0.000125 / call  │
                └───────────────────────────┘                                     └───────────────────────────┘
```

1. **Local Quantized Models for High-Frequency, Specialized Tasks ($0 API Cost)**:
   - **Visual Image Embedding**: `Xenova/clip-vit-base-patch32` running locally in FP16 precision to generate dense 512-dimensional visual vectors.
   - **Semantic Text Vectorization**: `nomic-embed-text-v1.5` for high-dimensional 768-dimensional text embedding spaces.
   - **Article Summarization**: `Xenova/t5-small` running locally inside the Node.js runtime to condense long-form post text into punchy semantic abstracts without spending external tokens.
2. **Cloud Multimodal Foundation Model for Complex Visual Understanding**:
   - **Google Gemini 3.1 Flash Lite**: Reserved specifically for deep visual question answering, structured JSON schema extraction (subject, category, attributes, natural language caption), and confidence verification.
   - Billed at an economical **$0.000125 per image**, ensuring enterprise-grade visual intelligence at minimal expense.

---

### 5. Strict Runtime Schema Validation with Zod for Consistent, Deterministic AI Results

Generative vision LLMs produce probabilistic natural language outputs that can suffer from schema drift, missing attributes, or invalid data types. To guarantee absolute data consistency and system reliability, the engine uses **Zod** as a strict runtime contract boundary (`src/services/image-understand.service.ts`):

```typescript
export const VisionTagSchema = z.object({
    subject: z.string().min(1),
    category: z.string().min(1),
    attributes: z.array(z.string()).default([]),
    caption: z.string().min(1),
    confidence: z.number().min(0).max(1),
});
```

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ZOD RUNTIME VALIDATION & GUARDRAIL FLOW                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 Raw AI Response (JSON from Gemini 3.1 Flash Lite)
                      │
                      ▼
   ┌─────────────────────────────────────┐
   │    Zod Schema Parsing & Typing      │ ──▶ Parse Failure ──▶ Throws ZodError ──▶ BullMQ Retries
   │     VisionTagSchema.parse(...)      │
   └─────────────────────────────────────┘
                      │
                      ▼ Validated Schema
   ┌─────────────────────────────────────┐
   │ Confidence Threshold Check (>= 0.8) │ ──▶ Confidence < 0.8 ──▶ Status: low_confidence (No embed)
   └─────────────────────────────────────┘
                      │
                      ▼ Confidence >= 0.80
   ┌─────────────────────────────────────┐
   │ ValidatedImageData Entity Produced  │ ──▶ Persisted to image_tags ──▶ ChromaDB Vector Indexing
   └─────────────────────────────────────┘
```

#### Why Zod Validation Is Essential for AI Pipelines:
- **Deterministic Type Safety**: Transforms loosely-typed JSON responses from Google Gemini into strongly-typed `ValidatedImageData` objects. Eliminates runtime `TypeError: undefined is not an object` exceptions downstream.
- **Strict Quality & Safety Guardrails**: Enforces boundary rules such as non-empty subject strings (`min(1)`), structured attribute arrays (`z.array(z.string())`), and strict confidence normalization (`min(0).max(1)`).
- **Automated Low-Confidence Filtering**: If `confidence < 0.80`, the service safely marks the image `low_confidence`, preventing sub-par semantic annotations from polluting downstream ChromaDB vector spaces.
- **Resilient Retry Lifecycle**: If the LLM produces a malformed schema, Zod throws a descriptive validation error, causing BullMQ to automatically retry the job with exponential backoff.

---

### 6. PostgreSQL + ChromaDB Dual-Storage Architecture

- **PostgreSQL 16 (ACID Relational Core)**: Single source of truth for entity states, timestamps, schema-validated tags (`image_tags`), auditable financial ledgers (`cost_log`), and human approval workflows (`suggestion`). Employs `SELECT ... FOR UPDATE` row locks to prevent duplicate worker processing.
- **ChromaDB (High-Dimensional Vector Space)**: Manages low-latency HNSW index collections (`image_embeddings` and `text_embeddings`) for sub-10ms Approximate Nearest Neighbor (ANN) cosine similarity matching.

---

### 7. Deterministic Financial Observability & Micro-Cent Cost Accounting

Unlike opaque AI applications, this system accounts for every micro-dollar spent:

$$\text{Total Cost} = \sum \text{Cost}_{\text{Vision}} + \sum \text{Cost}_{\text{Embedding}} + \sum \text{Cost}_{\text{Summarization}}$$

- **Gemini Vision**: Billed at actual token usage via `usageMetadata`:
  - Input tokens: **$0.25 / 1M tokens**
  - Output tokens: **$1.50 / 1M tokens**
  - Image tokens counted automatically (258 tokens per ≤384px image, tiled for larger)
  - Pre-request estimation available via `models.countTokens()`
- **Nomic Embeddings**: Logged at $\left(\frac{\text{Text Length}}{4 \times 1000}\right) \times \$0.00002$.
- **Local T5-Small Summarization**: Logged at **$0.000000**.
- Every single API interaction writes an immutable record to the `cost_log` table with its exact timestamp, calling component, reference UUID, **total tokens consumed (input + output)**, and total USD.

---

## High-Level Architectural Schematic Diagram

The following diagram illustrates the complete multilayered architecture. Notice how **Workers act as thin dispatchers that invoke Domain Services, never Repositories directly**:

```mermaid
flowchart TD
    Client(["🌐 Client / Browser / Frontend Dashboard"])

    subgraph PresentationLayer ["1. Presentation & Transport Layer"]
        Router["🛣️ Express 5 Router\n(/images, /posts, /jobs, /cost-log)\n• Pure HTTP translation • No business logic"]
        Static["🎨 Static SPA Dashboard\n(Dashboard, Jobs, Images, Posts, Ranking)"]
        IoC["💉 TSyringe DI Container\n(Keeps Model Singletons & Pools Resident in Memory)"]
    end

    subgraph OrchestrationLayer ["2. Orchestration & Queue Management Layer"]
        Orchestrator["⚙️ IngestionOrchestratorService\n(enqueueIngestionPipeline, onImageUnderstandComplete,\nenqueuePostPipeline, onPostSummarizeComplete)"]
        QueueService["📬 JobQueueService\n(BullMQ Queue Producers)"]
    end

    subgraph MessageBroker ["3. Distributed Asynchronous Broker (Redis 7)"]
        QVision[("📥 'vision' Queue\n(Image Understanding Jobs)")]
        QEmbed[("📥 'embed' Queue\n(Image & Post Vector Jobs)")]
        QSummarize[("📥 'post-summarize' Queue\n(Article Summarization Jobs)")]
    end

    subgraph WorkerLayer ["4. Distributed Worker Execution Layer (Thin Consumers)"]
        WVision["👁️ Vision Worker\n• Concurrency: 5\n• Runs 1 step, hands control back\n• Calls Domain Service only"]
        WEmbed["🧬 Text Embed Worker\n• Concurrency: 10\n• Runs 1 step, hands control back\n• Calls Domain Service only"]
        WSummarize["📝 Post Summarize Worker\n• Concurrency: 5\n• Runs 1 step, hands control back\n• Calls Domain Service only"]
    end

    subgraph DomainServiceLayer ["5. Domain Business Logic Layer (Services)"]
        S_Understand["🧠 ImageUnderstandService\n• Business rules & Zod schema validation\n• Coordinates Gemini & Repos"]
        S_EmbedText["🔤 TextEmbedService\n• Coordinates Nomic & Repos"]
        S_EmbedImg["🖼️ ImageEmbedService\n• Coordinates CLIP & Repos"]
        S_Summarize["📝 PostSummarizeService\n• Coordinates T5-Small & Repos"]
        S_Download["🌐 PostDownloadService\n• Fetches web article text"]
        S_Matching["🎯 MatchingService & EvaluationService\n• Cosine Similarity & Guardrails"]
    end

    subgraph AIProviders ["6. Tiered AI Inference Providers"]
        subgraph CloudAI ["Cloud Multimodal Model"]
            Gemini["☁️ Google Gemini 3.1 Flash Lite\n(Detailed Vision Tagging & VQA: $0.000125)"]
        end
        subgraph LocalAI ["Local Quantized Small Models ($0 API Cost)"]
            CLIP["🖼️ Local CLIP ViT-B/32 (FP16)\n(Visual Embeddings)"]
            Nomic["🔤 Local Nomic Embed Text v1.5\n(Text Vectors)"]
            T5["💻 Local T5-Small Pipeline\n(Article Summarization)"]
        end
    end

    subgraph RepositoryLayer ["7. Data Access & Persistence Layer (Repositories)"]
        R_ImageDB["📚 ImageDBRepository\n(UNNEST bulk SQL queries)"]
        R_PostDB["📚 PostDBRepository\n(posts CRUD & summary updates)"]
        R_CostDB["📚 CostLogDBRepository\n(cost_log financial records)"]
        R_SuggDB["📚 SuggestionDBRepository\n(suggestion review table)"]
        R_TextEmbed["📚 TextEmbedRepository\n(Chroma text_embeddings)"]
        R_ImageEmbed["📚 ImageEmbedRepository\n(Chroma image_embeddings)"]
        R_VisionAI["📚 ImageUnderstandRepository\n(Gemini SDK Client)"]
        R_SummarizeAI["📚 PostSummarizeRepository\n(T5 Inference Client)"]
    end

    subgraph StorageLayer ["8. Dual-Storage Persistence Engines"]
        subgraph RelationalDB ["PostgreSQL 16 Engine (Operational Master)"]
            T_Img[("Table: image\n(State, URLs, Metadata)")]
            T_Post[("Table: post\n(State, Summary, Content)")]
            T_Tags[("Table: image_tags\n(Captions, Categories, Attributes)")]
            T_Cost[("Table: cost_log\n(Financial Auditing & Units)")]
            T_Sugg[("Table: suggestion\n(Human Approval & Matches)")]
        end
        subgraph VectorDB ["ChromaDB Instance (Semantic Vector Space)"]
            C_Img[("Collection: image_embeddings\n(CLIP 512-dim vectors)")]
            C_Text[("Collection: text_embeddings\n(Nomic 768-dim vectors)")]
        end
    end

    %% Inbound HTTP Flow
    Client -->|"HTTP Requests (JSON)"| Router
    Client -->|"Views & Polling"| Static
    Router --> IoC
    IoC --> Orchestrator
    IoC --> S_Matching
    Orchestrator -->|"Produce Jobs"| QueueService
    Orchestrator -->|"Bulk Insert (UNNEST)"| R_ImageDB
    Orchestrator -->|"Bulk Insert (UNNEST)"| R_PostDB

    QueueService --> QVision
    QueueService --> QEmbed
    QueueService --> QSummarize

    %% Worker Execution - Workers call Domain Services ONLY
    QVision --> WVision
    QEmbed --> WEmbed
    QSummarize --> WSummarize

    WVision -->|"1. Invokes Service"| S_Understand
    WVision -.->|"2. Signals Completion"| Orchestrator

    WEmbed -->|"1. Invokes Service"| S_EmbedText

    WSummarize -->|"1. Invokes Service"| S_Summarize
    WSummarize -.->|"2. Signals Completion"| Orchestrator

    Orchestrator -->|"Triggers Visual Embeddings"| S_EmbedImg

    %% Domain Services coordinate AI and Repositories
    S_Understand -->|"Inference Request"| R_VisionAI
    R_VisionAI --> Gemini
    S_Understand -->|"Lock, State & Tag Writes"| R_ImageDB
    S_Understand -->|"Record API Spend"| R_CostDB

    S_EmbedText -->|"Generate Text Vectors"| R_TextEmbed
    R_TextEmbed --> Nomic
    R_TextEmbed --> C_Text
    S_EmbedText -->|"Update State & Log Cost"| R_ImageDB
    S_EmbedText -->|"Update State & Log Cost"| R_PostDB
    S_EmbedText -->|"Record API Spend"| R_CostDB

    S_EmbedImg -->|"Generate Image Vectors"| R_ImageEmbed
    R_ImageEmbed --> CLIP
    R_ImageEmbed --> C_Img

    S_Summarize -->|"Download HTML"| S_Download
    S_Summarize -->|"Summarize Text"| R_SummarizeAI
    R_SummarizeAI --> T5
    S_Summarize -->|"Save Summary & State"| R_PostDB

    %% Evaluation & Matching Flow
    S_Matching -->|"Fetch Summary"| R_PostDB
    S_Matching -->|"Query ANN Nearest Neighbors"| R_TextEmbed
    S_Matching -->|"Persist Review Candidates"| R_SuggDB

    %% Repositories connect to Storage
    R_ImageDB --> T_Img
    R_ImageDB --> T_Tags
    R_PostDB --> T_Post
    R_CostDB --> T_Cost
    R_SuggDB --> T_Sugg

    %% Styling
    classDef pres fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef orch fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
    classDef broker fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;
    classDef worker fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20;
    classDef service fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#f57f17;
    classDef ai fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#880e4f;
    classDef repo fill:#e0f2f1,stroke:#00897b,stroke-width:2px,color:#004d40;
    classDef storage fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238;

    class Router,Static,IoC pres;
    class Orchestrator,QueueService orch;
    class QVision,QEmbed,QSummarize broker;
    class WVision,WEmbed,WSummarize worker;
    class S_Understand,S_EmbedText,S_EmbedImg,S_Summarize,S_Download,S_Matching service;
    class Gemini,CLIP,Nomic,T5 ai;
    class R_ImageDB,R_PostDB,R_CostDB,R_SuggDB,R_TextEmbed,R_ImageEmbed,R_VisionAI,R_SummarizeAI repo;
    class T_Img,T_Post,T_Tags,T_Cost,T_Sugg,C_Img,C_Text storage;
```

---

## End-to-End Request/Response Lifecycle

### 1. Asynchronous Image Ingestion & Multimodal Vectorization

The following sequence illustrates the lifecycle of a batch of image URLs ingested via `POST /images`. Notice how **Workers delegate directly to Domain Services**, and Domain Services mediate between Repositories, AI APIs, and Storage:

```mermaid
sequenceDiagram
    autonumber
    actor Client as 🌐 Client / Dashboard
    participant API as 🛣️ Express Router (/images)
    participant Orchestrator as ⚙️ Ingestion Orchestrator
    participant Queue as 📬 BullMQ ("vision", "embed")
    participant VWorker as 👁️ Vision Worker
    participant S_Understand as 🧠 ImageUnderstandService
    participant R_ImageDB as 📚 ImageDBRepository
    participant Gemini as ☁️ Gemini 3.1 Flash Lite API
    participant S_EmbedImg as 🖼️ ImageEmbedService
    participant EWorker as 🧬 Text Embed Worker
    participant S_EmbedText as 🔤 TextEmbedService
    participant Chroma as 🗃️ ChromaDB ("image_embeddings", "text_embeddings")
    participant DB as 🗄️ PostgreSQL ("image", "image_tags", "cost_log")

    Client->>API: POST /images { "image_urls": ["https://.../fox.jpg"] }
    API->>Orchestrator: enqueueIngestionPipeline(urls)
    Orchestrator->>R_ImageDB: insert(images)
    R_ImageDB->>DB: INSERT INTO "image" (id, url_path, status='pending')
    DB-->>R_ImageDB: Rows with UUIDs
    R_ImageDB-->>Orchestrator: Image models
    Orchestrator->>Queue: addVisionJobs(imageIds)
    Orchestrator-->>API: { batchId: "uuid", count: 1 }
    API-->>Client: HTTP 202 Accepted { batchId, count }

    Note over Queue,VWorker: Asynchronous Queue Processing (Concurrency: 5)
    Queue->>VWorker: Dequeue job (imageId)
    VWorker->>S_Understand: understandAndProcessImage(imageId)
    Note over S_Understand: Worker calls Domain Service (NOT Repository)
    
    S_Understand->>R_ImageDB: acquireLockAndSetProcessing(imageId)
    R_ImageDB->>DB: SELECT * FROM "image" WHERE id=... FOR UPDATE
    R_ImageDB->>DB: UPDATE "image" SET status='processing'
    
    S_Understand->>Gemini: analyzeImage(imageUrl)
    Gemini-->>S_Understand: JSON { subject, category, attributes, caption, confidence }
    Note over S_Understand: Validate schema with Zod (confidence >= 0.8)
    
    S_Understand->>R_ImageDB: saveImageTags(tags)
    R_ImageDB->>DB: INSERT INTO image_tags (...)
    S_Understand->>DB: INSERT INTO cost_log (call_type='vision', cost_usd=0.000125)
    S_Understand->>R_ImageDB: updateStatus(imageId, 'completed')
    S_Understand-->>VWorker: ValidatedImageData
    
    VWorker->>Orchestrator: onImageUnderstandComplete([imageData])
    Orchestrator->>S_EmbedImg: embedImagesFromUrls(...)
    S_EmbedImg->>Chroma: Upsert visual vector to 'image_embeddings' (Local CLIP FP16)
    Orchestrator->>Queue: addEmbedJobs([imageId], 'image')

    Note over Queue,EWorker: Asynchronous Text Embedding Worker
    Queue->>EWorker: Dequeue embed job (imageId)
    EWorker->>S_EmbedText: embedImageCaption(imageId)
    Note over S_EmbedText: Worker calls Domain Service (NOT Repository)
    
    S_EmbedText->>R_ImageDB: updateStatus(imageId, 'embedding')
    S_EmbedText->>Chroma: Upsert text vector to 'text_embeddings' (Local Nomic)
    S_EmbedText->>DB: INSERT INTO cost_log (call_type='embedding', cost_usd=...)
    S_EmbedText->>R_ImageDB: updateStatus(imageId, 'embedded')
    R_ImageDB->>DB: UPDATE "image" SET status='embedded'
```

---

### 2. Post Summarization, Embedding & Semantic Image Matching

The following sequence illustrates how blog articles are ingested, summarized locally via **PostSummarizeService** using quantized **T5-Small**, vector-embedded via **TextEmbedService**, and matched against pre-indexed images via **EvaluationService**:

```mermaid
sequenceDiagram
    autonumber
    actor Client as 🌐 Client / Dashboard
    participant API as 🛣️ Express Router (/posts)
    participant Orchestrator as ⚙️ Ingestion Orchestrator
    participant Queue as 📬 BullMQ ("post-summarize", "embed")
    participant SWorker as 📝 Post Summarize Worker
    participant S_Summarize as 📝 PostSummarizeService
    participant S_Download as 🌐 PostDownloadService
    participant EWorker as 🧬 Text Embed Worker
    participant S_EmbedText as 🔤 TextEmbedService
    participant Eval as 🎯 EvaluationService
    participant Chroma as 🗃️ ChromaDB ("text_embeddings")
    participant DB as 🗄️ PostgreSQL ("post", "suggestion")

    %% Ingestion Stage
    Client->>API: POST /posts { "post_urls": ["https://.../article"] }
    API->>Orchestrator: enqueuePostPipeline(postUrls)
    Orchestrator->>S_Download: fetchPostsText(postUrls)
    Orchestrator->>DB: INSERT INTO "post" (url_path, status='pending')
    Orchestrator->>Queue: addPostSummarizeJobs(postIds)
    Orchestrator-->>API: { batchId: "uuid", count: 1 }
    API-->>Client: HTTP 202 Accepted

    %% Worker Processing - Worker delegates to PostSummarizeService
    Note over SWorker: Autonomous Summarization Worker (T5-Small)
    Queue->>SWorker: Dequeue job (postId)
    SWorker->>S_Summarize: summarizePost(postId)
    Note over S_Summarize: Worker calls Domain Service (NOT Repository)
    
    S_Summarize->>DB: UPDATE "post" SET status='summarizing'
    S_Summarize->>S_Summarize: Generate summary via local T5-Small ($0 API Cost)
    S_Summarize->>DB: UPDATE "post" SET summary=..., status='summarized'
    S_Summarize-->>SWorker: summary string
    
    SWorker->>Orchestrator: onPostSummarizeComplete(postId, summary)
    Orchestrator->>Queue: addEmbedJobs([postId], 'post')

    %% Embedding Worker Stage
    Queue->>EWorker: Dequeue embed job (postId)
    EWorker->>S_EmbedText: embedPostSummary(postId)
    Note over S_EmbedText: Worker calls Domain Service (NOT Repository)
    
    S_EmbedText->>Chroma: Index post summary embedding in 'text_embeddings'
    S_EmbedText->>DB: UPDATE "post" SET status='embedded'

    %% Semantic Retrieval Stage
    Client->>API: GET /posts/:id/images?results_number=10
    API->>Eval: evaluate(postId, 10)
    Eval->>DB: SELECT summary FROM "post" WHERE id=postId
    Eval->>Chroma: Query 'text_embeddings' (ANN search with post vector)
    Chroma-->>Eval: Top 10 candidate image IDs + Cosine Similarities + Metadata
    Note over Eval: Apply Threshold Guardrail (Similarity >= 0.80 & Category Match)
    Eval->>DB: INSERT INTO suggestion (post_id, image_id, similarity, guard_decision)
    Eval-->>API: Formatted EvaluationResponse
    API-->>Client: HTTP 200 OK (Post summary, Ranked Candidates, Reasons)
```

---

## Layer Responsibilities & Component Directory

| Layer / Subsystem | Concrete Files | Primary Responsibility | Input Contract | Output Contract |
| :--- | :--- | :--- | :--- | :--- |
| **Presentation (HTTP)** | `src/app.ts`<br>`src/routes/*.ts` | Translates HTTP requests, parses headers/parameters, delegates to Services/Orchestrator, renders static SPA. **Zero business logic.** | HTTP Request (JSON/Params) | HTTP Response (JSON / Status) |
| **Dependency Injection** | `src/config/container.ts` | Configures TSyringe IoC container; registers singletons for Repositories, Domain Services, and Queues. **Retains model weights and DB pools resident in RAM.** | Configuration tokens | Injected instances |
| **Orchestration** | `src/services/ingestion-orchestrator.service.ts`<br>`src/services/job-queue.service.ts` | Coordinates pipeline sequencing, produces BullMQ jobs, coordinates post-worker lifecycle callbacks. | Entity IDs / Domain DTOs | Batch IDs / Queued Jobs |
| **Worker Consumers (Thin)** | `src/workers/image-understand.worker.ts`<br>`src/workers/text-embed.worker.ts`<br>`src/workers/post-summarize.worker.ts` | **"Run one step, then hand control back."** Dequeues BullMQ jobs, resolves target Domain Services via TSyringe, and reports completion to Orchestrator. **Never touches Repositories.** | BullMQ Job with UUID payload | Invocation of Domain Service |
| **Domain Services** | `src/services/image-understand.service.ts`<br>`src/services/text-embed.service.ts`<br>`src/services/post-summarize.service.ts`<br>`src/services/evaluation.service.ts`<br>`src/services/matching.service.ts`<br>`src/services/image-query.service.ts`<br>`src/services/post-query.service.ts` | **"For each of these, do a thing."** Core business logic layer. Coordinates AI inference, schema validation with Zod, state transactions, cost calculation, and interacts directly with Repositories. | Domain Models, IDs, Embeddings | Domain Entities, Similarity Candidates |
| **Repositories (Data Access)** | `src/repositories/*-db.repository.ts`<br>`src/repositories/*-embed.repository.ts`<br>`src/repositories/*-understand.repository.ts` | **"Translate one bulk operation to SQL/Vector queries."** Encapsulates PostgreSQL SQL queries (`UNNEST`), ChromaDB collection operations, and external SDK clients (Gemini, Pexels). **No for-loops.** | Query specs / Models | DB rows / Vector records |
| **Frontend UI** | `public/*.html`<br>`public/js/api.js`<br>`public/css/style.css` | Real-time observability dashboard, Kanban board, Pexels image search, and matching inspector. | Browser user input | Visual DOM updates |

---

## System Invariants & Strict Architectural Rules

The following non-negotiable invariants are enforced across the codebase:

1. **Unidirectional Control Flow & Worker Delegation**:
   $$\text{Route} \longrightarrow \text{Orchestrator} \longrightarrow \text{BullMQ Queue} \longrightarrow \text{Worker} \longrightarrow \mathbf{\text{Domain Service}} \longrightarrow \mathbf{\text{Repository}} \longrightarrow \text{Database / ChromaDB}$$
   - **Workers NEVER call Repositories directly**.
   - **Workers NEVER call raw SQL or database connections directly**.
   - **Workers ONLY resolve and invoke Domain Services** (`ImageUnderstandService`, `TextEmbedService`, `PostSummarizeService`) and report lifecycle events to `IngestionOrchestratorService`.
2. **Repositories Translate Bulk Operations (No Loops in Repos)**:
   - Repositories express batch mutations as single SQL statements (e.g., `UNNEST` arrays). Repositories must never run loops calling `insert()` multiple times.
3. **Services Own Business Orchestration**:
   - The Service layer is the only layer permitted to iterate over items to apply domain rules, validations, and AI inferences.
4. **PostgreSQL Is the Single Source of Truth**:
   The relational database owns definitive state. BullMQ acts strictly as an ephemeral transport mechanism. If a worker crashes or Redis restarts, pending jobs can be safely reconciled from `image.status = 'pending'`.
5. **Pessimistic Concurrency Control**:
   All database state transitions acquire row-level locks via `SELECT ... FOR UPDATE` inside the Domain Service layer before mutating row states to eliminate race conditions across distributed worker replicas.
6. **Monotonically Advancing State Machine**:
   - **Images**: `pending` $\longrightarrow$ `processing` $\longrightarrow$ `completed` $\longrightarrow$ `embedding` $\longrightarrow$ `embedded` (or `failed` / `low_confidence`).
   - **Posts**: `pending` $\longrightarrow$ `summarizing` $\longrightarrow$ `summarized` $\longrightarrow$ `embedding` $\longrightarrow$ `embedded` (or `failed`).
   Status transitions can never move backward.
7. **Universal UUID Idempotency**:
   The PostgreSQL-generated `id` (UUID v4) serves as the BullMQ `jobId`, the ChromaDB vector record ID, the `cost_log.ref_id`, and the foreign key in `image_tags` and `suggestion`.
8. **Isolated Blast Radii**:
   Each queue (`vision`, `embed`, `post-summarize`) runs on an independent Redis stream with isolated concurrency and retry parameters. A crash in vision inference does not block embedding or summarization.
9. **Strict Schema & Confidence Guardrails with Zod**:
   Vision responses from Gemini must pass `VisionTagSchema.parse()`. Images with AI confidence scores $< 0.80$ are automatically marked `low_confidence` and excluded from embedding.
10. **Mandatory Cost Logging**:
    Every billable API execution logs an auditable entry into `cost_log` inside the Domain Service before marking a job complete.

---

## Database Schema & Data Persistence Models

All relational tables are created automatically on startup by `DatabaseInitializerService.initializeAll()`:

```sql
-- Core image entity tracking table
CREATE TABLE IF NOT EXISTS "image" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "url_path" TEXT NOT NULL,
    "tags" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Core blog/article post tracking table
CREATE TABLE IF NOT EXISTS "post" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "url_path" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Structured semantic annotations extracted from Gemini Vision
CREATE TABLE IF NOT EXISTS image_tags (
    image_id UUID PRIMARY KEY REFERENCES "image"(id) ON DELETE CASCADE,
    subject TEXT,
    category TEXT,
    attributes TEXT[],
    caption TEXT,
    confidence NUMERIC,
    flagged BOOLEAN DEFAULT FALSE,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fine-grained financial cost audit log
CREATE TABLE IF NOT EXISTS cost_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_type TEXT NOT NULL CHECK (call_type IN ('vision', 'embedding', 'summarization')),
    ref_id UUID NOT NULL,
    tokens_or_units NUMERIC NOT NULL,
    cost_usd NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cost_log_call_type ON cost_log (call_type);
CREATE INDEX IF NOT EXISTS idx_cost_log_ref_id ON cost_log (ref_id);

-- Post-to-image semantic matching suggestions & approval workflow
CREATE TABLE IF NOT EXISTS suggestion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES "post"(id) ON DELETE CASCADE,
    image_id UUID REFERENCES "image"(id) ON DELETE SET NULL,
    similarity NUMERIC(5, 4),
    guard_decision TEXT NOT NULL CHECK (guard_decision IN ('accepted', 'rejected', 'no_match')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suggestion_post_id_idx ON suggestion (post_id);
CREATE INDEX IF NOT EXISTS suggestion_status_idx ON suggestion (status);
```

---

## API Endpoints Reference & Payload Examples

### Image Ingestion & Search Endpoints

#### `POST /images`
Enqueues a batch of image URLs for asynchronous processing.

- **Request Body**:
```json
{
  "image_urls": [
    "https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg",
    "https://images.pexels.com/photos/145939/pexels-photo-145939.jpeg"
  ]
}
```
- **Response (`202 Accepted`)**:
```json
{
  "batchId": "a5d8f36e-b12a-43c2-bf72-8869151e39da",
  "count": 2
}
```

#### `GET /download/images`
Searches the Pexels API for curated, high-resolution stock photography to feed into the ingestion pipeline.

- **Query Parameters**: `?search=red+fox`
- **Response (`200 OK`)**:
```json
{
  "photos": [
    {
      "id": 2295744,
      "width": 4000,
      "height": 2667,
      "url": "https://www.pexels.com/photo/close-up-photography-of-fox-sitting-on-ground-2295744/",
      "photographer": "Ray Bilcliff",
      "src": {
        "original": "https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg",
        "large": "https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
      },
      "alt": "Close-up Photography of Fox Sitting on Ground"
    }
  ]
}
```

#### `GET /download.html`
Web-based Pexels image discovery interface for searching, previewing, and selecting images to enqueue.

- **Features**: Search query, results per page (10-50), multi-select grid, double-click preview modal, batch enqueue to `POST /images`
- **Navigation**: Accessible via "Download" link in top navigation bar

#### `GET /images`
Retrieves a paginated list of processed images with optional filtering.

- **Query Parameters**:
  - `limit` (optional, default: 50, max: 100) — Number of results per page
  - `offset` (optional, default: 0) — Pagination offset
  - `status` (optional) — Filter by status (`pending`, `processing`, `completed`, `embedding`, `embedded`, `failed`, `low_confidence`)
  - `url_path` (optional) — Filter by exact URL match
  - `filename` (optional) — Filter by exact filename match
  - `orderBy` (optional, default: `created_at`) — Sort field: `created_at`, `updated_at`, `filename`
  - `orderDir` (optional, default: `DESC`) — Sort direction: `ASC`, `DESC`

- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "image.jpg",
      "url_path": "https://...",
      "tag": { "subject": "...", "category": "...", "attributes": [...], "caption": "...", "confidence": 0.95 },
      "status": "completed",
      "created_at": "2026-01-15T10:30:00.000Z",
      "updated_at": "2026-01-15T10:35:00.000Z"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```
Item fields include `id`, `filename`, `url_path`, `tag` (JSONB with subject, category, attributes, caption, confidence), `status`, `created_at`, `updated_at`.

#### `GET /posts`
Retrieves a paginated list of processed posts with optional filtering.

- **Query Parameters**:
  - `limit` (optional, default: 50, max: 100) — Number of results per page
  - `offset` (optional, default: 0) — Pagination offset
  - `status` (optional) — Filter by status (`pending`, `summarizing`, `summarized`, `embedding`, `embedded`, `failed`)
  - `url_path` (optional) — Filter by exact URL match
  - `orderBy` (optional, default: `created_at`) — Sort field: `created_at`, `updated_at`, `url_path`
  - `orderDir` (optional, default: `DESC`) — Sort direction: `ASC`, `DESC`

- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "url_path": "https://example.com/article",
      "summary": "Article summary text...",
      "status": "embedded",
      "created_at": "2026-01-15T10:30:00.000Z",
      "updated_at": "2026-01-15T10:35:00.000Z"
    }
  ],
  "total": 87,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```
Item fields include `id`, `url_path`, `summary`, `status`, `created_at`, `updated_at`.

---

### Post Processing & Semantic Matching Endpoints

#### `POST /posts`
Enqueues a batch of article/blog URLs for scraping, local summarization, and vector embedding.

- **Request Body**:
```json
{
  "post_urls": [
    "https://en.wikipedia.org/wiki/Red_fox"
  ]
}
```
- **Response (`202 Accepted`)**:
```json
{
  "batchId": "c8e0b6d2-97fc-48fa-bb65-983196884102",
  "count": 1
}
```

#### `GET /posts/:id/images`
Executes vector similarity search against indexed images using the post's semantic summary embedding. Evaluates candidate matches against similarity thresholds and category guardrails.

- **URL Parameter**: `id` (UUID of the post)
- **Query Parameter**: `?results_number=10` (default: 10)
- **Response (`200 OK`)**:
```json
{
  "postId": "7b884dbb-320d-45bf-97c2-3e28ceceb115",
  "postSummary": "The red fox (Vulpes vulpes) is the largest of the true foxes and one of the most widely distributed members of the order Carnivora, inhabiting North America, Europe, and Asia.",
  "candidates": [
    {
      "imageId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "imageUrl": "https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg",
      "post": "The red fox (Vulpes vulpes) is the largest of the true foxes...",
      "candidate": "A sharp close-up photo of a wild red fox sitting in a snowy woodland meadow.",
      "result": "ACCEPTED",
      "reason": "Similarity 0.92 ≥ 0.80 threshold",
      "similarity": 0.9241
    },
    {
      "imageId": "123e4567-e89b-12d3-a456-426614174000",
      "imageUrl": "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg",
      "post": "The red fox (Vulpes vulpes) is the largest of the true foxes...",
      "candidate": "Two golden retriever puppies playing with a tennis ball on green grass.",
      "result": "REJECTED",
      "reason": "Category mismatch: post about \"fox\", image is \"dog\" (similarity 0.64 < 0.80)",
      "similarity": 0.6412
    }
  ]
}
```

---

### Distributed Queue Monitoring Endpoints

#### `GET /jobs`
Returns real-time BullMQ job statistics across queues.

- **Query Parameters**: `?queue=vision&status=completed&limit=50`
- **Response (`200 OK`)**:
```json
{
  "jobs": [
    {
      "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "queue": "vision",
      "status": "completed",
      "progress": 100,
      "timestamp": 1726084920000
    }
  ],
  "total": 1
}
```

#### `GET /jobs/:queue/:id`
Inspects individual job state in `vision`, `embed`, or `post-summarize` queues.

- **Response (`200 OK`)**:
```json
{
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "queue": "vision",
  "status": "completed"
}
```

---

### Cost Tracking & Observability Endpoints

#### `GET /cost-log`
Audits individual AI inference cost records.

- **Query Parameters**: `?callType=vision&timeRange=24h&limit=100`
- **Response (`200 OK`)**:
```json
{
  "logs": [
    {
      "id": "e9b1c7a8-12d3-45f6-a789-0123456789ab",
      "call_type": "vision",
      "ref_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "tokens_or_units": "1",
      "cost_usd": "0.000125",
      "created_at": "2026-09-11T20:15:00.000Z"
    }
  ],
  "total": 1
}
```

#### `GET /cost-log/stats`
Aggregates financial expenditure across time windows (`1h`, `24h`, `7d`, `30d`).

- **Response (`200 OK`)**:
```json
{
  "timeRange": "24h",
  "totalCalls": 450,
  "totalCost": 0.05735,
  "byType": {
    "vision": {
      "count": 400,
      "totalCost": 0.05,
      "totalTokens": 400
    },
    "embedding": {
      "count": 50,
      "totalCost": 0.00735,
      "totalTokens": 367500
    },
    "summarization": {
      "count": 15,
      "totalCost": 0,
      "totalTokens": 0
    }
  },
  "avgCostPerCall": 0.000127
}
```

---

## Interactive Frontend Observability Suite

The application serves a clean, responsive dashboard directly from `/public`:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  IMAGE UNDERSTANDING ENGINE | Dashboard   Download   Jobs   Images   Posts   Ranking   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Dashboard (`/dashboard.html`)**:
   - High-level KPIs: Total Images Processed, Total Posts Processed, 24-Hour Expenditure (USD), Average Cost Per Vision Call.
   - Interactive Cost Log Explorer with real-time filtering by Call Type (`vision`, `embedding`, `summarization`) and Time Window.
   - Recent Activity Stream auto-refreshing every 30 seconds.
2. **Image Discovery (`/download.html`)**:
   - Search Pexels stock photography with query + results-per-page selector
   - Masonry grid with lazy-loaded thumbnails, photographer credit, dimensions
   - Click to select/deselect (visual accent border feedback)
   - Double-click for full-screen modal preview
   - "Enqueue Selected" batches chosen URLs directly into `POST /images` pipeline
3. **Jobs Monitor (`/jobs.html`)**:
   - Dual visualization modes: **Tree Table View** and **Interactive Kanban Board**.
   - Live queue status tracking across `pending`, `processing`, `completed`, `embedding`, `embedded`, and `failed`.
   - Detailed modal inspection showing attempt counts, stack traces, and failure reasons.
4. **Image Ingestion Hub (`/images.html`)**:
   - Direct integration with Pexels API: Search stock photos, multi-select, and enqueue directly into BullMQ.
   - Manual bulk URL enqueue textarea for custom datasets.
   - Paginated image listing via `GET /images` with status filtering, sorting, and ID display.
   - Inline preview modal for quick image inspection.
5. **Post Ingestion Portal (`/posts.html`)**:
   - Bulk URL ingestion for web articles, Wikipedia entries, and blog content.
   - Paginated post listing via `GET /posts` with status filtering, sorting, and ID display.
   - Post detail modal with summary preview and navigation to semantic ranking.
6. **Semantic Ranking & Evaluation Studio (`/ranking.html`)**:
   - Enter any processed Post UUID to preview the generated summary.
   - Real-time Cosine Similarity evaluation against indexed images.
   - Interactive similarity threshold slider ($\ge 0.70$ to $0.90$).
   - Visual candidate inspection displaying match badges, reasons, captions, and thumbnail previews.

---

## Install & Quick Start

### Single-Command Deployment via Docker Compose

The complete distributed stack (Express API, PostgreSQL 16, Redis 7, and ChromaDB) can be booted with a single command:

```bash
docker compose up --build
```

- **API & Observability Dashboard**: `http://localhost:3000`
- **ChromaDB Vector Service**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432` (`dev:dev`)
- **Redis Message Broker**: `localhost:6379`

### Local Development Setup

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/ambientWave/flyrank-capstone-ai-image-relevance-content-matching-engine.git
cd flyrank-capstone-ai-image-relevance-content-matching-engine
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Google Gemini & Pexels API keys

# 3. Start local dependencies (PostgreSQL, Redis, ChromaDB)
docker compose up -d db redis chromadb

# 4. Start the development server (auto-reloads with nodemon)
npm run dev
```

The database schema and indexes are initialized automatically on boot.

---

## Environment Configuration

Create a `.env` file in the root directory modeled after `.env.example`:

| Variable | Type | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | Port on which the Express web server listens. | `3000` |
| `DATABASE_URL` | String | PostgreSQL connection string including credentials and database name. | `postgresql://postgres:dev@localhost:5432/image_understanding_content_matching` |
| `REDIS_HOST` | String | Hostname for the Redis message broker. | `localhost` |
| `REDIS_PORT` | Number | Port for the Redis message broker. | `6379` |
| `CHROMADB_HOST` | String | Hostname for ChromaDB vector database. | `localhost` (or `chromadb` in Docker) |
| `CHROMADB_PORT` | Number | Port for ChromaDB REST service. | `8000` |
| `GEMINI_API_KEY` | String | Google AI Studio API key for Gemini Vision inference. | `AIzaSy...` |
| `PEXELS_API_KEY` | String | Pexels Developer API key for curated image search. | `563492...` |
| `HF_TOKEN` | String | Optional HuggingFace Access Token for transformer downloads. | `hf_...` |

---

## Frequently Asked Questions (FAQ) for AI Crawlers & Developers

### What is the Image Understanding & Content Matching Engine?
It is an asynchronous multimodal pipeline that uses Express, TypeScript, BullMQ, Redis, PostgreSQL, and ChromaDB to ingest image batches, extract semantic captions and structured tags via Google Gemini 3.1 Flash Lite, vectorize images with CLIP and Nomic embeddings, and semantically match relevant images to long-form blog articles.

### Why was TSyringe chosen for Dependency Injection?
Heavy AI model wrappers (such as `CLIPVisionModelWithProjection` in FP16), tokenizer pipelines, and database connection pools require significant memory and CPU time to load. TSyringe ensures that these heavy resources are instantiated **exactly once at startup** as singletons. Their states remain resident in memory across all HTTP requests and background worker runs, eliminating model re-loading latency.

### How does Zod schema validation ensure consistent AI outputs?
Generative LLM responses can vary or suffer from schema drift. The engine enforces runtime verification via `VisionTagSchema.parse()`, checking that subject, category, attributes, caption, and confidence are strictly typed. If an AI output fails validation, Zod triggers a controlled retry in BullMQ; if confidence is below 0.80, the entity is marked `low_confidence`, protecting ChromaDB from corrupt or inaccurate vectors.

### How does the system separate responsibilities between Routes, Services, Repositories, and Workers?
The architecture enforces a strict decision-making hierarchy:
- **Routes**: Pure HTTP mapping (one service call, no loops).
- **Services**: The sole owner of business logic ("for each of these, do a thing", validations, AI calls).
- **Repositories**: Pure bulk database operations (e.g. `UNNEST` in SQL, no loops).
- **Workers**: "Run one step, then hand control back" (delegates to Domain Services, never calls Repositories).

### Why do BullMQ workers call Domain Services instead of calling Repositories directly?
In accordance with clean layered monolithic architecture, **workers are thin execution drivers**. Their sole responsibility is job dispatching and lifecycle reporting. All domain validation, transaction boundaries, row-locking semantics (`SELECT ... FOR UPDATE`), schema parsing via Zod, and external AI calls are encapsulated within the **Domain Service layer** (e.g., `ImageUnderstandService`, `TextEmbedService`, `PostSummarizeService`). This guarantees testability, reusability across HTTP and background execution contexts, and prevents database coupling in the message consumer layer.

### Why is a hybrid AI model strategy used instead of using Gemini for everything?
Small, frequent tasks like visual embedding (`clip-vit-base-patch32`), text vectorization (`nomic-embed-text-v1.5`), and article summarization (`t5-small`) are executed **locally with quantized, small-footprint models at $0 API cost**. A large cloud foundation model (**Google Gemini 3.1 Flash Lite**) is reserved for deep multimodal reasoning and tag extraction. This hybrid approach drastically slashes operational costs while preserving top-tier visual understanding.

### How does the system guarantee exactly-once processing across workers?
Domain Services wrap execution in database transactions utilizing PostgreSQL row-level locks via `SELECT ... FOR UPDATE`. If multiple worker replicas attempt to process the same image simultaneously, only one acquires the lock; subsequent workers observe `status != 'pending'` and skip redundant execution.

---

## References

- [When the request can't wait: background jobs & durable workflows w/ Haris](https://www.youtube.com/watch?v=j4QWa9wJbi4)
- [Google GenAI SDK for Gemini 3.1 Flash Lite](https://ai.google.dev/)
- [HuggingFace Inference & Transformers.js](https://huggingface.co/docs)
- [BullMQ Documentation - Distributed Background Jobs for Node.js](https://docs.bullmq.io/)
