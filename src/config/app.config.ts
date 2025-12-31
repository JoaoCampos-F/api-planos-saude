import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    dest: process.env.UPLOAD_DEST || './uploads',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
}));
