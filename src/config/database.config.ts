import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  oracle: {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: parseInt(process.env.ORACLE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.ORACLE_POOL_MAX || '10', 10),
    poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '1', 10),
  },
  schemas: {
    gc: process.env.ORACLE_SCHEMA_GC || 'gc',
    nbs: process.env.ORACLE_SCHEMA_NBS || 'nbs',
  },
}));
