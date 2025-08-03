/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscriptionTier: string;
      subscriptionStatus: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    subscriptionTier: string;
    subscriptionStatus: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    subscriptionTier: string;
    subscriptionStatus: string;
  }
}