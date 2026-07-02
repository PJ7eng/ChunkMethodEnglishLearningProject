# ChunkLearning Backend

## Development
1. Run `npm install` for download dependency
2. Run `docker compose up -d` for starting the database
3. Run `npm run start:dev` for running the backend server

## Database

### Update Database
1. Go to `schema.prisma` file under prisma directory
2. Modify the database schema
3. Run `npx prisma migrate dev --name init` for updating the database, where `init` is the name of the new modification

## API Notes

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (requires `Authorization: Bearer <token>`)
- `GET /chunks`
- `GET /chunks/random`
