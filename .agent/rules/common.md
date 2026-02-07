---
trigger: always_on
---

# Common Instructions

This file contains common instructions and coding standards for the Application.

## General
- This app must be built using Next.js, Shadcn/ui and Bun
- Before you start, read all the files in the `.agent/rules/` directory
- Use **ES6+** syntax.
- Prefer **async/await** over callbacks or raw promises.
- Use descriptive variable and function names.
- Keep functions small and focused on a single task.
- Use Shadcn/ui for all UI components
- Components must be functional components using arrow functions
- Database passwords, API Keys, sensitive information must use environment variables

## Libraries
- Use **TanStack Query** for data fetching and state management
- Use **Zod** for form validation
- Use **Shadcn/ui** for UI components
- Use **Tailwind CSS** for styling
- Use **ESLint** for linting
- Use **Prettier** for code formatting
- Use **Vitest** for unit testing
- Use **Zustand** for state management
- Use **useForm** from **react-hook-form** for form management

## Project Structure
- `.github/`: Github configuration
- `workflows/`: Github workflows
- `data/`: Data persisted from volumes, log files, config files.
- `docker-compose.yml`: Compose file used to build this app

## Database Config
- Use a non-root MySQL user
- Disable empty passwords
- Store credentials in env vars
- Persist data using volumes

## Testing
- All services, helper functions and hooks must have unit tests

## Rules
- Do not import React explicitly. Rely on the automatic JSX runtime.
- Components must be functional components using arrow functions. Props and hooks are allowed.
- Use Shadcn/ui's built-in dark mode support
- You must use `Zod` for form validation
- On form error you must provide a message displaying what is wrong
- Once you finish everything make sure to run `bun install` and `bun run build`

## Error Handling
- Use centralized error handling when possible.
- Always provide meaningful error messages in responses.
- Backend must use a centralized Express error-handling middleware.

## Compose
- It must build a mysql database (MySQL 8.0)
- It must build frontend that depends on mysql
- **Traefik** is used as the reverse proxy (v2.11).
    - Do not use Nginx.
    - Use Docker Labels on services (`traefik.http.routers...`) to configure routing.
- MySQL database config must follow good and secure practices
- Do not add version to the start of the file, it's deprecated


## Github Actions
- Create a workflow to build and test the app on pull request
- Create a workflow to build and publish the app on push to main branch

## Github
- Create a .gitignore file
- Create a README.md file
- Create a LICENSE file
- Create a .env.example file