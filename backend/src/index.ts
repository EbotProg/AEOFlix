import express, { Request, Response } from "express";
import videoRoutes from './routes/videoRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/videos', videoRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to AEOFlix Backend!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});