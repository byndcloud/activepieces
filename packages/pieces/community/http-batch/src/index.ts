
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { PieceCategory } from '@activepieces/shared';
    import { httpSendRequestAction } from './lib/actions/send-http-request-action';

    export const httpBatch = createPiece({
      displayName: "HTTP Batch",
      description: 'Sends HTTP requests and return responses',
      logoUrl: 'https://cdn.activepieces.com/pieces/http.png',
      categories: [PieceCategory.CORE],
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      actions: [httpSendRequestAction],
      authors: [
        'bibhuty-did-this',
        'landonmoir',
        'JanHolger',
        'Salem-Alaa',
        'kishanprmr',
        'AbdulTheActivePiecer',
        'khaledmashaly',
        'abuaboud',
        'pfernandez98',
      ],
      triggers: [],
    });
    