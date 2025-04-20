import { Request } from 'express';
import { IUser } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
      user?: IUser;
    }
  }
}
