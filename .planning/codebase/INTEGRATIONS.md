# External Integrations - PMS TS

## Authentication & Identity Management
- **OpenID Connect (OIDC) / Keycloak**: Identity management system for authentication and authorization.
- **Role-Based Access Control (RBAC)**: Fine-grained access control based on user roles and authorities fetched from the profile service.
- **Session/Cookie Auth**: Axios configured with `withCredentials: true` for cross-origin session management.

## Backend Services (Microservices)
The application integrates with several microservices hosted under the Phuc Sinh Assistant ecosystem:
- **Expense Service**: Management of expenses.
- **Inventory Service**: Product inventory tracking.
- **Product & Product Group Services**: Catalog management.
- **Invoice Service**: Billing and invoice management.
- **Profit Service**: Financial reporting and analysis.
- **Reservation & Room Services**: Booking and accommodation management.
- **Order Service**: Order processing and management.
- **Supplier Service**: Supplier invoice and relationship management.
- **Tour Service**: Tour request and management.
- **Config & Status Services**: System configuration and health monitoring.
- **Reservation Extractor**: AI-driven extraction of reservation data.

## AI & Data Processing
- **Google Gemini AI**: Used for intelligent data processing and content generation.
- **Reservation Extractor Service**: Specialized service for parsing and extracting data from reservation documents.

## Object Storage
- **MinIO**: S3-compatible object storage for file management (uploads/downloads).

## Cloud & Third-party Integrations
- **Firebase**: Integrated for additional backend features (analytics, hosting, etc.).
- **GCS Syncer**: Integration for syncing with Google Cloud Storage.
