
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
    import { getDatabase } from "./lib/actions/get-database";
    import { listDatabase } from "./lib/actions/list-database";
    import { updateDatabase } from "./lib/actions/update-database";
    import {deleteDatabaseItem} from './lib/actions/delete-database';
    import {createDatabaseItem} from './lib/actions/create-database';
    import { databaseTrigger } from "./lib/triggers/database-trigger";
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    export type QuotiAuthType = { org_slug: string; BearerStatic: string };
    
    export const quotiAuth = PieceAuth.CustomAuth({
      description: 'Enter Quoti Auth authentication details',
      props: {
          org_slug: Property.ShortText({
              displayName: 'Org Slug',
              description: 'Enter the base organization info present on your URL, like: https://quoti.cloud/$ORG_SLUG$/',
              required: true,
          }),
          BearerStatic: PieceAuth.SecretText({
              displayName: 'BearerStatic',
              description: 'Enter the access token',
              required: true
          })
      },
      // Optional Validation
      validate: async ({auth}) => {
          if(auth.BearerStatic.length > 0 && auth.org_slug.length > 0){
              return {
                  valid: true,
              }
          }
          return {
              valid: false,
              error: 'Invalid Auth'
          }
      },
      required: true
  })
    
    export const quoti = createPiece({
      displayName: "Quoti",
      auth: quotiAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://storage.googleapis.com/beyond-quoti-users-files/Quoti.svg",
      authors: [],
      actions: [listDatabase, getDatabase, createDatabaseItem, updateDatabase, deleteDatabaseItem,
        createCustomApiCallAction({
          // The auth object defined in the piece
          auth: quotiAuth,
          // The base URL for the API
          baseUrl: (auth: any) => {
            return `https://api.quoti.cloud/api/v1/${auth.org_slug}`
          },
          // Mapping the auth object to the needed authorization headers
          authMapping: async (auth: any) => {
            return {
              'BearerStatic': `${auth.BearerStatic}`
            }
          }
        })
      ],
      triggers: [databaseTrigger],
    });
    