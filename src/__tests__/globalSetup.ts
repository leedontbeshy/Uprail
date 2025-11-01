import * as dotenv from 'dotenv';
import * as path from 'path';

export default async () => {
  // Load test environment variables
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
};
