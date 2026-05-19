/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/auth` | `/auth/otp` | `/demos/create-collection` | `/demos/create-person` | `/demos/create-person-with-liveness` | `/demos/delete-person` | `/demos/detect-face` | `/demos/face-comparison` | `/demos/face-comparison-liveness` | `/demos/face-detection` | `/demos/humanid` | `/demos/humanid-create` | `/demos/humanid-create-qr` | `/demos/humanid-decrypt` | `/demos/humanid-preview` | `/demos/liveness` | `/demos/search-active-user` | `/demos/search-crops` | `/demos/search-live-person` | `/demos/search-person` | `/demos/update-person` | `/demos/verify-face` | `/home` | `/settings` | `/settings/api-key` | `/settings/language` | `/settings/profile`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
