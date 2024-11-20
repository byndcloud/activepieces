
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
    // import { getTicket } from "./lib/actions/get-ticket";
    // import { listTicket } from "./lib/actions/list-ticket";
    // import { updateTicket } from "./lib/actions/update-ticket";
    // import {deleteTicket} from './lib/actions/delete-ticket';
    import {createTicket} from './lib/actions/create-ticket';
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
    
    export const legis = createPiece({
      displayName: "Legis",
      auth: quotiAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://storage.googleapis.com/beyond-quoti-users-files/legis_icon.svg",
      authors: [],
      actions: [
        createTicket, 
        // listTicket, 
        // getTicket, 
        // updateTicket, 
        // deleteTicket
    ],
      triggers: [databaseTrigger],
    });
    