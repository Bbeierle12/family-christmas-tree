import { User, WorkspaceMember } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      workspaceMember?: WorkspaceMember;
      io?: SocketIOServer;
    }
  }
}

export {};
