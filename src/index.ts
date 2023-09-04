import { Request, Response, NextFunction } from 'express';
import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import indexRoutes from './routes/index';


const app = express();
const port = 3000;
app.use('/api', indexRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('This is the homepage.');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
