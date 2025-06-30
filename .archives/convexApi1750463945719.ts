import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  messages: {
    getForCurrentUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
  };
  adminUsers: {
    getAdminUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getAllUsers: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    storeAdminUser: FunctionReference<
      "mutation",
      "public",
      { email?: string },
      any
    >;
  };
  subscriberUsers: {
    getSubscriberUser: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    storeSubscriberUser: FunctionReference<
      "mutation",
      "public",
      { email?: string },
      any
    >;
  };
};
export type InternalApiType = {};
