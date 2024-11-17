
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import {sign} from './lib/actions/sign'
    
    export const jwtAuth = PieceAuth.SecretText({
      displayName: 'Signing Private Key',
      required: true,
      description: 'Please use the following bash command to convert your key from multi-line to single line key: `awk \'NF {sub(/\r/, ""); printf "%s\\n",$0;}\' key.pem > key.cer`   ',
    });

    export const jwt = createPiece({
      displayName: "JWT",
      auth: jwtAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://storage.googleapis.com/beyond-quoti-users-files/jwt-logo.png",
      authors: [],
      actions: [sign],
      triggers: [],
    });
    