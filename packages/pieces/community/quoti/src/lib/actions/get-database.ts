import {
  createAction,
  Property,
  PieceAuth,
  DynamicPropsValue
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {databasesDropdown, filterField} from '../common'
import { quotiAuth } from '../..';
import axios from 'axios';
type QueryParams = {
  [key: string]: string | object; // Index signature
};

export const getDatabase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getDatabase',
  auth: quotiAuth,
  displayName: 'Get from database',
  description: 'Get a specific item from a database',
  props: {
    databaseSlug: databasesDropdown,
    id: Property.ShortText({
      displayName: 'Id',
      description: 'Please enter a valid ID to retrieve an item from the selected database.',
      required: false,
      defaultValue: '',
    }),
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
      refreshers: ['hasAdvancedProps'],
      props: async (propsValue) => {
        // const authentication = propsValue['authentication'];
        const hasAdvancedProps = propsValue['hasAdvancedProps']
        if(hasAdvancedProps) {
          const properties = {
            json: Property.Json({
              displayName: 'Advanced JSON',
              description: 'If you use this option all previous filter and settings will be OVERWRITE.',
              required: false,
              defaultValue: {"where": {"a": "c"}, "limit": 25, "params": {}},
            })
          };
      
          return properties;
        } else return {
        }
      },
    })
    
    },
  async run(context) {
    let queryParams: QueryParams = {
    }
    if(context.propsValue['hasAdvancedProps'] && Object.keys(context.propsValue['advancedProps']['json']).length > 0 ){
      queryParams = context.propsValue['advancedProps']['json']
    }
    const res = await axios.get(`https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/${context.propsValue['databaseSlug']}/${context.propsValue['id']}`, {
      headers: {
        BearerStatic: context.auth.BearerStatic, // Pass API key in headers
      },
      params: queryParams
    })
    return res.data;
  },
});
