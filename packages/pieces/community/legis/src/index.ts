
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
    // import { getTicket } from "./lib/actions/get-ticket";
    // import { listTicket } from "./lib/actions/list-ticket";
    // import { updateTicket } from "./lib/actions/update-ticket";
    // import {deleteTicket} from './lib/actions/delete-ticket';
    import {createTicket} from './lib/actions/create-ticket';
    import { databaseTrigger } from "./lib/triggers/database-trigger";
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    export type QuotiAuthType = { org_slug: string; BearerStatic: string };

    export const legisAuth = PieceAuth.CustomAuth({
      description: 'Coloque as credenciais do legis',
      props: {
          org_slug: Property.ShortText({
              displayName: 'Ambiente',
              description: 'O ambiente pode ser obtido através da url do legis: https://dashboard.legishub.com.br/$AMBIENTE$/',
              required: true,
          }),
          BearerStatic: PieceAuth.SecretText({
              displayName: 'Conta de serviço',
              description: 'Coloque o token da conta de serviço que pode ser obtido pelo link:  https://dashboard.legishub.com.br/serviceaccounts',
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
              error: 'Token inválido'
          }
      },
      required: true
  })

    export const legis = createPiece({
      displayName: "Legis",
      auth: legisAuth,
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
