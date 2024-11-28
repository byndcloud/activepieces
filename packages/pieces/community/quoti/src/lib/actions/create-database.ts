import {
  createAction,
  Property,
  PieceAuth,
  DynamicPropsValue
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {databasesDropdown, filterField, databaseSelectedFieldsForm, databaseFields} from '../common'
import { quotiAuth, QuotiAuthType } from '../..';
import axios from 'axios';
type QueryParams = {
  [key: string]: string | object; // Index signature
};

export const createDatabaseItem = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createDatabaseItem',
  auth: quotiAuth,
  displayName: 'Create on database',
  description: 'Create a specific item on a database',
  props: {
    databaseSlug: databasesDropdown,
    fieldsUsed: databaseFields,
    fields: databaseSelectedFieldsForm,
    hasAdvancedProps: Property.Checkbox({
      displayName: 'Advanced',
      description: 'Check this box to show advanced configuration',
      required: false,
      defaultValue: false,
    }),
    advancedProps: Property.DynamicProperties({
      description: 'Dynamic Form',
      displayName: 'Dynamic Form',
      required: true,
      refreshers: ['hasAdvancedProps', 'fields'],
      props: async (propsValue) => {
        // const authentication = propsValue['authentication'];
        const hasAdvancedProps = propsValue['hasAdvancedProps']
        if(hasAdvancedProps) {
          const properties = {
            json: Property.Json({
              displayName: 'Body JSON',
              description: 'If you use this option all previous settings will be OVERWRITE.',
              required: false,
              defaultValue: propsValue['fields'],
            })
          };
      
          return properties;
        } else return {
        }
      },
    })
    
    },
  async run(context) {
    let body: QueryParams = {
    }
    if(context.propsValue['hasAdvancedProps'] && Object.keys(context.propsValue['advancedProps']['json']).length > 0 ){
      body = context.propsValue['advancedProps']['json']
    } else {
      if(context.propsValue['fields'] && Object.keys(context.propsValue['fields']).length > 0){
        for (const prop of Object.keys(context.propsValue['fields'])){
            body[prop] = context.propsValue['fields'][prop]
        }
      }
    }
    console.log('BODY', JSON.stringify(body))
    const res = await axios.post(`https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/${context.propsValue['databaseSlug']}`,body, {
      headers: {
        BearerStatic: context.auth.BearerStatic, // Pass API key in headers
      }
    })
    return res.data;
  },
});
