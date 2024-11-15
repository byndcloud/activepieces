import {
  createAction,
  Property,
  PieceAuth,
  Validators,
  DynamicPropsValue
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {databasesDropdown, filterField} from '../common'
import { quotiAuth } from '../..';
import axios from 'axios';
type QueryParams = {
  [key: string]: string | object; // Index signature
};

export const listDatabase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'listDatabase',
  auth: quotiAuth,
  displayName: 'List from database',
  description: 'List items from a database',
  props: {
    databaseSlug: databasesDropdown,
    filterField,
    filterValue: Property.ShortText({
      displayName: 'Value',
      description: 'Enter a value to filter by',
      required: false,
      defaultValue: '',
    }),
    limit: Property.ShortText({
      displayName: 'Limit',
      description: 'Enter a value',
      required: true,
      defaultValue: '25',
      validators: [Validators.pattern(/^[0-9]+$/)]
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
      limit: `${context.propsValue['limit']}`,
    }
    console.log('TESTE de ADVANCED PROPS', JSON.stringify(context.propsValue['advancedProps']))
    if(context.propsValue['hasAdvancedProps'] && Object.keys(context.propsValue['advancedProps']['json']).length > 0 ){
      queryParams = context.propsValue['advancedProps']['json']
    } else{
    if(context.propsValue['filterField'] && context.propsValue['filterValue'] && context.propsValue['filterValue'].length > 0){
      const key = `where[${context.propsValue['filterField']}]`
      queryParams[key] = context.propsValue['filterValue']
    }
    }
    const res = await axios.get(`https://api.quoti.cloud/api/v1/${context.auth.org_slug}/resources/${context.propsValue['databaseSlug']}`, {
      headers: {
        BearerStatic: context.auth.BearerStatic, // Pass API key in headers
      },
      params: queryParams
    })
    return res.data;
  },
});
