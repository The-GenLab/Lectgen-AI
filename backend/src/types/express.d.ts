import UserModel from '../core/models/User';

declare global {
  namespace Express {
    interface User extends UserModel {}
  }
}

export {};
