# Text Embeddings Prototype

This project is a prototype for generating and utilizing text embeddings for job classification. It leverages OpenAI's GPT-3.5 for text summarization and cosine similarity for embedding comparisons.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Database Schema](#database-schema)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/text-embeddings-prototype.git
   cd text-embeddings-prototype
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_database_url
   ```

4. Run database migrations:

   ```sh
   pnpm run db:migrate
   ```

5. Seed the database:
   ```sh
   pnpm run db:seed
   ```
6. Open the database in your browser:
   ```sh
   pnpm run db:studio
   ```

## Usage

To start the main process, run:

```sh
pnpm start
```

This will execute the main script located in `src/index.ts`, which processes jobs, generates summaries, creates embeddings, and associates tags with jobs.

## Scripts

### `init-companies-data.ts`

Initializes the companies data in the database.

### `init-jobs-data.ts`

Fetches jobs from external platforms and stores them in the database.

### `get-title-and-tags.ts`

Retrieves job details along with their associated tags.

### `init-tags-data.ts`

Initializes the job function tags data in the database.

### `init-platforms-data.ts`

Initializes the platforms data in the database.

## Database Schema

The database schema includes the following tables:

- `platforms`: Stores platform details.
- `jobs`: Stores job details.
- `tags`: Stores tags.
- `tagsToJobs`: Associates tags with jobs.
- `jobSummaries`: Stores job summaries and their embeddings.
- `jobSummaryPrompts`: Stores prompts for generating job summaries.
- `companies`: Stores company details.
