# Database and Cache: Elearning Website Backend

## MongoDB (Database)
- **Library**: Mongoose
- **Connection File**: `utils/db.ts`
- **Connection Logic**:
  - Reads the database URL from the environment variable `DB_URL`.
  - Attempts to connect to MongoDB using Mongoose.
  - Logs the host upon successful connection.
  - Implements a retry mechanism with a 5-second delay in case of connection failure.

### Related Files
- `models/`: Contains Mongoose schemas for various entities:
  - `ai.model.ts`
  - `course.model.ts`
  - `layout.model.ts`
  - `notification.model.ts`
  - `order.model.ts`
  - `user.model.ts`

## Redis (Cache)
- **Library**: IORedis
- **Connection File**: `utils/redis.ts`
- **Connection Logic**:
  - Reads the Redis URL from the environment variable `REDIS_URL`.
  - Throws an error if the URL is not provided.
  - Logs a success message upon successful connection.

### Notes
- Redis is likely used for caching or session management, though specific usage is not detailed in the code provided.

### Related Files
- `utils/redis.ts`: Configures and initializes the Redis client.
