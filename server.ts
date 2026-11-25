import app from './app.ts';
import { config } from './config.ts';

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
  console.log(`Try a short link: http://localhost:${config.port}/s/node01`);
});
