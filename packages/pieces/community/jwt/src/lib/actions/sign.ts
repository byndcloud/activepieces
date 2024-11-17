import { jwtAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import jwt from 'jsonwebtoken'
import fs from 'fs'
export const sign = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sign',
  displayName: 'Sign',
  auth: jwtAuth,
  description: 'Create a digital signature for the token to ensure its authenticity and integrity',
  props: {
    json: Property.Json({
      displayName: 'Data',
      description: 'Enter JSON data to be signed',
      required: true,
      defaultValue: {
        version: "v3",
        externalUserId: "user_id",
        externalProjectId: "user_project_id",
        firstName: "John",
        lastName: "Doe",
        role: "EDITOR",
        email: "john@example.com",
        piecesFilterType: "NONE",
        exp: 123456789, // calculate 5 minutes from now
      },
    }),
    algorithm: Property.StaticDropdown({
      displayName: 'Algorithm',
      description: 'Select your algorithm',
      required: true,
      options: {
        options: [
          {
            label: 'RS256',
    
            value: 'RS256',
          },
          {
            label: 'HS256',
            value: 'HS256',
          },
          {
            label: 'HS384',
            value: 'HS384',
          },{
            label: 'HS512',
            value: 'HS512',
          },
          {
            label: 'RS384',
            value: 'RS384',
          },{
            label: 'RS512',
            value: 'RS512',
          },
          {
            label: 'ES256',
            value: 'ES256',
          },
          {
            label: 'ES384',
            value: 'ES384',
          },
          {
            label: 'ES512',
            value: 'ES512',
          }
        ],
      },
    }),
    kid: Property.ShortText({
      displayName: 'Header kid',
      description: 'Enter signingKeyID',
      required: true,
      defaultValue: '',
    })
  },
  async run(context) {
    // Action logic here
    // JWT NumericDates specified in seconds:
    // const currentTime = Math.floor(Date.now() / 1000);
    console.log('The context.auth')
    console.log(context.auth.split('\\n').join('\n'))
    const algorithm: jwt.Algorithm = context.propsValue['algorithm'] as jwt.Algorithm
    console.log('The algorithm is:', algorithm)
    console.log('The kid is:', context.propsValue['kid'])
    const options: jwt.SignOptions = {
      algorithm,
      header: {
        alg: context.propsValue['algorithm'],
        "typ": "JWT",
        kid: context.propsValue['kid'], // Include the "kid" in the header
      },
    };
    const token = jwt.sign(
      context.propsValue['json'],
      context.auth.split('\\n').join('\n'),
      options
    );
    return {token}
  },
});
