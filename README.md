# Ever Plane Proxy API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)

A comprehensive proxy API that bridges Ever Gauzy backend services with Plane frontend applications. Built with NestJS, this middleware layer provides seamless integration between project management systems while maintaining data consistency and security.

## 🚀 Features

- **🔌 Proxy Architecture**: Seamless integration between Ever Gauzy APIs and Plane frontend
- **🏗️ Modular Design**: Clean, maintainable architecture with separate modules for different functionalities
- **🔐 Authentication & Authorization**: Robust security with JWT tokens and role-based access control
- **📊 Project Management**: Complete project lifecycle management with issues, cycles, and modules
- **👥 Workspace Management**: Multi-tenant workspace support with user roles and permissions
- **📈 Dashboard & Analytics**: Real-time insights and customizable dashboard widgets
- **🔄 Real-time Updates**: Live notifications and activity tracking
- **📝 Issue Management**: Comprehensive issue tracking with labels, states, and relations
- **🎯 Sprint Management**: Cycle-based project planning and execution
- **💬 Collaboration**: Comments, mentions, and team collaboration features

## 📁 Project Structure

This monorepo is organized using Yarn workspaces and Turborepo:

```
ever-plane/
├── apps/
│   ├── api-plane/          # Production API runner
│   └── docs/               # Documentation (future)
├── packages/
│   ├── plugin-plane/       # Core NestJS proxy API implementation
│   └── models/             # Shared TypeScript models and interfaces
├── package.json            # Root package configuration
├── turbo.json             # Turborepo configuration
└── README.md              # This file
```

### 📦 Packages Overview

#### `@gauzy/plugin-plane` - Core API Implementation
The main NestJS application providing the proxy functionality:
- **Authentication**: Login, registration, and token management
- **User Management**: Profile, settings, and workspace access
- **Project Management**: CRUD operations for projects and members
- **Issue Tracking**: Complete issue lifecycle management
- **Workspace Operations**: Multi-tenant workspace handling
- **Dashboard**: Analytics and reporting widgets
- **Real-time Features**: Notifications and activity streams

#### `@plane-plugin/models` - Shared Models
TypeScript interfaces and models shared across the application:
- Data transfer objects (DTOs)
- API response interfaces
- Database entity models
- Configuration types

#### `ever-plan-api` - Production Runner
Lightweight application runner for production deployments.

## 🛠️ Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) 10.x
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.4.5
- **HTTP Client**: [Axios](https://axios-http.com/) with NestJS integration
- **Authentication**: JWT tokens with cookie-based storage
- **API Documentation**: [Swagger/OpenAPI](https://swagger.io/)
- **Build System**: [Turborepo](https://turbo.build/) for monorepo management
- **Package Manager**: [Yarn](https://yarnpkg.com/) with workspaces
- **Testing**: [Jest](https://jestjs.io/) with e2e testing support
- **Code Quality**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 18.0.0
- **Yarn**: 1.22.21 (specified in packageManager)
- **Ever Gauzy Backend**: Running instance for API integration

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ever-plane
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Configuration**
   Create environment files in `packages/plugin-plane/`:
   ```bash
   # .env

   # Frontend urls

   CLIENT_BASE_URL='http://localhost:3000'
   CLIENT_ADMIN_URL='http://localhost:3001'
   CLIENT_SPACE_URL='http://localhost:3100'
   APP_BASE_URL='http://localhost:3040'

   # Configs

   EXTERNAL_BASE_API_URL=https://your-gauzy-api.com/api # Hosted gauzy API
   EXTERNAL_BASE_LOCAL_API_URL=http://localhost:3000/api # Local gauzy API
   EXECUTION_MODE=develop  # Change to develop if want to use local Gauzy API

   # Auth and API KEYS
   API_KEY='T5BsfAsLY1eBvOEPWaYZi9uWXjcBheGM'
   API_SECRET='NBpQl2kV7OE1K9U02uTUNr5lGFhJw89DOuLJ9l6XgobzNk1xKSjQSAYjQpfYlGVD'
   ```

4. **Build the project**
   ```bash
   yarn build
   ```

5. **Start development server**
   ```bash
   yarn dev
   # or specifically for the API
   yarn start:api:dev
   ```

The API will be available at `http://localhost:3300` with Swagger documentation at `http://localhost:3300/api`.

## 📚 API Documentation

### Core Endpoints

The API follows RESTful conventions with the following main endpoint groups:

#### Authentication (`/auth`)
- `POST /auth/email-check` - Check if email exists
- `GET /auth/get-csrf-token` - Get CSRF token
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout

#### User Management (`/api/users`)
- `GET /api/users/me` - Get current user profile
- `GET /api/users/me/settings` - Get user settings
- `GET /api/users/me/workspaces` - Get user workspaces

#### Projects (`/api/workspaces/:workspace_name/projects`)
- `GET /details` - List all workspace projects
- `GET /:id` - Get specific project details
- `GET /:id/project-members/me` - Get current user's project membership

#### Issues (`/api/workspaces/:workspace_name/projects/:project_id/issues`)
- Full CRUD operations for issue management
- Issue labels, states, and relations
- Comments and reactions
- Issue links and dependencies

#### Workspaces (`/api/workspaces`)
- Workspace management and configuration
- Member management and roles
- Workspace settings and preferences

### API Features

- **Global Prefix**: `/api/workspaces/:workspace_name` (with specific exclusions)
- **CORS Support**: Configurable cross-origin resource sharing
- **Authentication**: JWT-based with cookie storage
- **Validation**: Automatic request/response validation
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: Built-in protection mechanisms

## 🏗️ Architecture

### Middleware Stack

1. **Cookie Parser**: Handles authentication cookies
2. **Token Middleware**: Extracts and validates JWT tokens
3. **Workspace Middleware**: Manages workspace context
4. **Auth Guard**: Protects routes with authentication requirements

### Service Architecture

- **API Fetch Service**: Centralized HTTP client for Ever Gauzy API calls
- **Module Services**: Domain-specific business logic
- **Transformers**: Data transformation between Ever Gauzy and Plane formats
- **Serializers**: Response formatting and data serialization

### Data Flow

```
Plane Frontend → Ever Plane Proxy → Ever Gauzy Backend
                      ↓
              Data Transformation
                      ↓
              Response Formatting
                      ↓
              Plane Frontend
```

## 🔧 Development

### Available Scripts

```bash
# Development
yarn dev                    # Start all packages in development mode
yarn start:api:dev         # Start only the API in development mode

# Production
yarn build                 # Build all packages
yarn start:api             # Start production API server

# Code Quality
yarn lint                  # Run ESLint
yarn format               # Format code with Prettier
```

### Development Workflow

1. **Feature Development**: Create feature branches from main
2. **Code Quality**: Ensure ESLint and Prettier compliance
4. **Documentation**: Update relevant documentation
5. **Build Verification**: Ensure successful build before PR

### Environment Modes

- **Development**: `EXECUTION_MODE=develop` - Uses local Gauzy API URLs
- **Production**: `EXECUTION_MODE=production` - Uses production Gauzy API URLs

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Standards

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Ensure ESLint and Prettier compliance
- Document new features and APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About Ever Co.

This project is developed and maintained by [Ever Co. LTD](https://ever.co).

- **Website**: [https://ever.co](https://ever.co)
- **Email**: [ever@ever.co](mailto:ever@ever.co)

## 🔗 Related Projects

- **[Ever Gauzy](https://github.com/ever-co/ever-gauzy)**: The backend platform this proxy connects to
- **[Ever Cloc](https://github.com/ever-co/ever-cloc)**: The backend platform this proxy connects to
- **[Plane](https://plane.so/)**: The frontend application this proxy serves

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/ever-gauzy-plugins-plane/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ever-gauzy-plugins-plane/discussions)
- **Email**: [ever@ever.co](mailto:ever@ever.co)

---

**Made with ❤️ by the Ever Co. team**
