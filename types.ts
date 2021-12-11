import { Response } from 'express';
export interface client {
  [key: number]: Response;
}

export interface clientNames {
  [key: number]: string;
}
