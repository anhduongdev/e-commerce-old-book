export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
});
